import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Stripe } from 'stripe';
import { OpenAI } from 'openai';
import * as puppeteer from 'puppeteer';
import * as nodemailer from 'nodemailer';

dotenv.config();

// Types moved from shared package
export interface ItineraryForm {
  city: string;
  date: string;
  start: string;
  end: string;
  interests: string[];
  email: string;
}

export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  duration: string;
  cost?: string;
}

export interface GeneratedItinerary {
  city: string;
  date: string;
  items: ItineraryItem[];
  totalCost: string;
  tips: string[];
}

// Utility function moved from shared package
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export const DEFAULT_ITINERARY_PROMPT = `
You are a travel planner AI. Generate a personalized, timestamped itinerary for someone visiting ${'${city}'} on ${'${date}'} from ${'${start}'} to ${'${end}'}. Their interests include: ${'${interests}'}.

Requirements:
- If the time window is short (2 hours or less), only suggest 1–2 focused activities (e.g., a café stop and a nearby view).
- If the time window is long (4+ hours), break the day into 6–8 segments covering breakfast, lunch, dinner, and various activities.
- For each activity, include:
  - "time": exact start time
  - "activity": a clear activity title
  - "location": name + neighborhood or address
  - "description": 1-sentence experience summary
  - "duration": e.g., "1 hour"
  - "cost": estimated cost in USD (e.g., "$10" or "Free")
  - "note": optional transition note (e.g., "15-minute ride to next location")
  - "mapsUrl": a Google Maps search link for the location, using this format: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(location + ", " + city)

Guidelines:
- Use real, well-rated places in ${'${city}'}.
- Match activities to the user's interests. If limited interests are given, default to a general balance of food, culture, nature, and fun.
- Group stops by neighborhood to reduce unnecessary travel.
- Add up to 3 smart tips at the end — local insights, reservations, dress/weather, transport, etc.

Respond ONLY in this strict JSON structure:
{
  "items": [
    {
      "time": "09:00",
      "activity": "Breakfast at Tartine Bakery",
      "location": "Tartine Bakery, 600 Guerrero St (Mission District)",
      "description": "Start your day with world-famous pastries and coffee.",
      "duration": "1 hour",
      "cost": "$15",
      "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Tartine+Bakery+San+Francisco"
    }
    // ...more items
  ],
  "totalCost": "$80-120",
  "tips": [ ... ]
}
`;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Webhook route FIRST, with raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  console.log('[STRIPE] Webhook received');
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log('[STRIPE] Webhook event type:', event.type);
  } catch (err) {
    console.error('[STRIPE] Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleSuccessfulPayment(session);
  }

  res.json({ received: true });
});

// All other routes use JSON
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory storage for form data (in production, use a database)
const formDataStore = new Map<string, ItineraryForm>();

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    }
  });
});

app.get('/test', async (req: Request, res: Response) => {
  try {
    // Test OpenAI connection
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'Hello from OpenAI!'" }],
      max_tokens: 10,
    });
    
    res.json({
      status: 'ok',
      openai: completion.choices[0]?.message?.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'OpenAI test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/checkout', async (req: Request, res: Response) => {
  const formData: ItineraryForm = req.body;
  if (!formData.email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: formData.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Custom Day Itinerary',
              description: `A personalized day plan for ${formData.city}`,
            },
            unit_amount: 100, // $1 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.WEB_URL}/thank-you`,
      cancel_url: `${process.env.WEB_URL}/`,
      metadata: {
        email: formData.email,
        sessionId: Date.now().toString(), // Use as key for form data
      },
    });

    // Store form data with session ID
    formDataStore.set(session.id, formData);
    
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation failed:', err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const email = session.metadata?.email;
    if (!email) {
      console.error('[STRIPE] No email in session metadata');
      return;
    }
    console.log(`[STRIPE] Handling successful payment for: ${email}`);

    // Get form data from our store
    const formData = formDataStore.get(session.id);
    if (!formData) {
      console.error('[STRIPE] No form data found for session:', session.id);
      return;
    }
    console.log('[FORM] Form data:', formData);

    console.log('[OPENAI] Generating itinerary...');
    const itinerary = await generateItinerary(formData);
    console.log('[OPENAI] Finished itinerary:', JSON.stringify(itinerary, null, 2));

    console.log('[PDF] Generating PDF...');
    const pdfBuffer = await generatePDF(itinerary);
    console.log(`[PDF] PDF generated (size: ${pdfBuffer.length} bytes)`);

    console.log(`[EMAIL] Creating email for ${email}`);
    await sendEmail(email, pdfBuffer, itinerary);
    console.log(`[EMAIL] Email sent to ${email}`);

    // Clean up stored data
    formDataStore.delete(session.id);

    console.log(`[STRIPE] Itinerary process complete for ${email}`);
  } catch (error) {
    console.error('[ERROR] Error handling successful payment:', error);
  }
}

function fillPromptTemplate(template: string, form: ItineraryForm): string {
  return template
    .replace(/\$\{city\}/g, form.city)
    .replace(/\$\{date\}/g, form.date)
    .replace(/\$\{start\}/g, form.start)
    .replace(/\$\{end\}/g, form.end)
    .replace(/\$\{interests\}/g, form.interests.join(', '));
}

async function generateItinerary(form: ItineraryForm): Promise<GeneratedItinerary> {
  // Use the shared prompt template
  const prompt = fillPromptTemplate(DEFAULT_ITINERARY_PROMPT, form);
  try {
    console.log('[OPENAI] Prompt sent:', prompt);
    console.log('[OPENAI] Sending prompt to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const response = completion.choices[0]?.message?.content;
    console.log('[OPENAI] Raw response:', response);
    if (!response) throw new Error('Failed to generate itinerary');
    const parsed = JSON.parse(response);
    return {
      city: form.city,
      date: form.date,
      items: parsed.items || [],
      totalCost: parsed.totalCost || '$80-120',
      tips: parsed.tips || [],
    };
  } catch (error) {
    console.error('[OPENAI] Failed to generate or parse itinerary:', error);
    // Fallback itinerary
    return {
      city: form.city,
      date: form.date,
      items: [
        {
          time: '09:00',
          activity: 'Start your day',
          location: 'City Center',
          description: 'Begin your adventure in the heart of the city',
          duration: '1 hour',
          cost: '$0'
        },
      ],
      totalCost: '$50-75',
      tips: ['Wear comfortable shoes', 'Bring a camera'],
    };
  }
}

async function generatePDF(itinerary: GeneratedItinerary): Promise<Buffer> {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Day Itinerary - ${itinerary.city}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; color: #333; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; }
          .item { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
          .time { font-weight: bold; color: #007bff; }
          .activity { font-size: 18px; margin: 5px 0; }
          .location { color: #666; font-style: italic; }
          .description { margin-top: 5px; }
          .cost { color: #222; font-size: 15px; margin-top: 2px; }
          .tips { margin-top: 30px; padding: 15px; background: #e7f3ff; border-radius: 5px; }
          .total-cost { text-align: center; font-size: 18px; margin: 20px 0; }
          .maps-link a {
            color: #2196f3;
            text-decoration: underline;
            font-weight: 500;
            display: inline-block;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Your Perfect Day in ${itinerary.city}</div>
          <div class="subtitle">${itinerary.date}</div>
        </div>
        
        <div class="total-cost">
          <strong>Estimated Cost: ${itinerary.totalCost}</strong>
        </div>
        
        ${itinerary.items.map((item: ItineraryItem & { mapsUrl?: string }) => `
          <div class="item">
            <div class="time">${item.time} (${item.duration})</div>
            <div class="activity">${item.activity}</div>
            <div class="location">📍 ${item.location}</div>
            <div class="description">${item.description}</div>
            <div class="cost"><strong>Cost:</strong> ${item.cost || ''}</div>
            ${item.mapsUrl ? `<div class="maps-link"><a href="${item.mapsUrl}" target="_blank">🗺️ View on Google Maps</a></div>` : ''}
          </div>
        `).join('')}
        
        <div class="tips">
          <h3>💡 Tips for Your Day</h3>
          <ul>
            ${itinerary.tips.map((tip: string) => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      </body>
      </html>
    `;
    console.log('[PDF] HTML template:', htmlTemplate);
    
    // Puppeteer configuration for different environments
    const puppeteerOptions: puppeteer.PuppeteerLaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    // In production, let Puppeteer find Chrome automatically
    if (process.env.NODE_ENV === 'production') {
      console.log('[PDF] Running in production mode - using system Chrome');
    }

    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.setContent(htmlTemplate);
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
    await browser.close();
    return pdf;
  } catch (error) {
    console.error('[PDF] Failed to generate PDF:', error);
    throw error;
  }
}

async function sendEmail(email: string, pdfBuffer: Buffer, itinerary: GeneratedItinerary) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your ${itinerary.city} Day Itinerary - ${itinerary.date}`,
    html: `
      <h2>Your Perfect Day in ${itinerary.city}</h2>
      <p>Thank you for your purchase! Here's your personalized day itinerary for ${itinerary.date}.</p>
      <p>Estimated cost: ${itinerary.totalCost}</p>
      <p>Enjoy your adventure! 🌟</p>
    `,
    attachments: [
      {
        filename: `itinerary-${itinerary.city}-${itinerary.date}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };
  console.log('[EMAIL] Email options:', JSON.stringify(mailOptions, null, 2));
  try {
    console.log('[EMAIL] Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email sent!');
  } catch (err) {
    console.error('[EMAIL] Failed to send email:', err);
    throw err;
  }
}

app.post('/generate', (req: Request, res: Response) => {
  const { city, date } = req.body;
  
  // Placeholder response
  res.json({
    itinerary: {
      city,
      date,
      activities: [
        {
          time: formatTime(new Date()),
          activity: 'Sample activity',
          location: 'Sample location',
          description: 'Sample description'
        }
      ]
    }
  });
});

// Manual test endpoint to trigger itinerary/email generation
app.post('/test-email', async (req: Request, res: Response) => {
  try {
    const formData: ItineraryForm = req.body;
    console.log('[TEST] Manual test-email trigger:', formData);

    // Generate itinerary, PDF, and send email
    const itinerary = await generateItinerary(formData);
    const pdfBuffer = await generatePDF(itinerary);
    await sendEmail(formData.email, pdfBuffer, itinerary);

    res.json({ status: 'ok', message: 'Email sent (if configured correctly)' });
  } catch (err: unknown) {
    console.error('[TEST] Failed to send test email:', err);
    res.status(500).json({ status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Test endpoint to see raw OpenAI response
app.post('/test-openai', async (req: Request, res: Response) => {
  try {
    const formData: ItineraryForm = req.body;
    const customPrompt = req.body.customPrompt;
    console.log('[TEST-OPENAI] Testing OpenAI with form data:', formData);

    // Use custom prompt if provided, otherwise use the shared default
    const prompt = customPrompt
      ? customPrompt
      : fillPromptTemplate(DEFAULT_ITINERARY_PROMPT, formData);

    console.log('[TEST-OPENAI] Sending prompt to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [{ role: "user", content: prompt }],
    });
    
    const response = completion.choices[0]?.message?.content;
    console.log('[TEST-OPENAI] Raw OpenAI response:', response);
    
    if (!response) {
      return res.status(500).json({ 
        status: 'error', 
        error: 'No response from OpenAI',
        prompt: prompt
      });
    }

    // Try to parse the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (parseError: unknown) {
      console.log('[TEST-OPENAI] Failed to parse JSON, returning raw response');
      return res.json({
        status: 'success',
        rawResponse: response,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        prompt: prompt
      });
    }

    res.json({
      status: 'success',
      rawResponse: response,
      parsedResponse: parsedResponse,
      prompt: prompt
    });

  } catch (err: unknown) {
    console.error('[TEST-OPENAI] Failed to test OpenAI:', err);
    res.status(500).json({ 
      status: 'error', 
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Test endpoint to verify Puppeteer is working
app.get('/test-puppeteer', async (req: Request, res: Response) => {
  try {
    console.log('[TEST-PUPPETEER] Testing Puppeteer...');
    
    const puppeteerOptions: puppeteer.PuppeteerLaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    if (process.env.NODE_ENV === 'production') {
      console.log('[TEST-PUPPETEER] Running in production mode');
    }

    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.setContent('<h1>Puppeteer Test</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
    res.send(pdf);
    
    console.log('[TEST-PUPPETEER] Puppeteer test successful');
  } catch (error) {
    console.error('[TEST-PUPPETEER] Puppeteer test failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
}); 