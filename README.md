# 1DollarDayItinerary

A microservice where users pay $1 to get a custom, timestamped day itinerary for any city — delivered via PDF to email.

## ✨ Features

- **$1 Payment**: Simple Stripe checkout for instant access
- **AI-Powered Itineraries**: OpenAI GPT-4 generates personalized day plans
- **Smart Recommendations**: Google Maps integration for restaurants and attractions
- **Beautiful PDFs**: Professional PDF generation with Puppeteer
- **Email Delivery**: Automatic email delivery with PDF attachment
- **Customizable**: Choose interests, time slots, and city preferences

## 🏗️ Project Structure

```
.
├── apps/
│   ├── web/         # Next.js frontend with form
│   └── api/         # Node.js backend with Stripe, OpenAI, PDF generation
├── .gitignore
├── README.md
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account
- OpenAI API key
- Google Maps API key
- Gmail account (for email delivery)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/1dollardayitinerary.git
cd 1dollardayitinerary
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your API keys:

```bash
cd apps/api
cp env.example .env
```

Edit `apps/api/.env` with your actual API keys:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Server Configuration
PORT=3001
```

### 3. API Key Setup

#### Stripe
1. Create a [Stripe account](https://stripe.com)
2. Get your test secret key from the dashboard
3. Set up a webhook endpoint pointing to `http://localhost:3001/webhook`
4. Get the webhook signing secret

#### OpenAI
1. Create an [OpenAI account](https://platform.openai.com)
2. Generate an API key
3. Add billing information (GPT-4 requires credits)

#### Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Maps JavaScript API and Places API
4. Create credentials (API key)

#### Gmail
1. Enable 2-factor authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use this password in the EMAIL_PASS field

### 4. Development

Start both frontend and backend:

```bash
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

### 5. Testing the Flow

1. Fill out the form on http://localhost:3000
2. Complete the $1 Stripe payment
3. Check your email for the PDF itinerary

## 🛠️ Running Individual Apps

#### Frontend (Next.js)
```bash
cd apps/web
npm run dev
```

#### Backend (Express)
```bash
cd apps/api
npm run dev
```

## 📋 How It Works

1. **User fills form** with city, date, time, interests, and email
2. **Stripe checkout** processes the $1 payment
3. **Webhook triggers** when payment is successful
4. **OpenAI generates** a personalized itinerary based on interests
5. **PDF is created** with beautiful formatting using Puppeteer
6. **Email is sent** with the PDF attachment
7. **User receives** their custom day plan

## 🎯 Example Itinerary Output

The generated PDF includes:
- **Time-scheduled activities** (9:00 AM - 6:00 PM)
- **Restaurant recommendations** with cuisine types
- **Attraction suggestions** based on interests
- **Estimated costs** for the day
- **Travel tips** and local insights
- **Beautiful formatting** with icons and styling

## 🛡️ Security Notes

- All API keys are stored in environment variables
- Stripe webhooks are verified with signatures
- Form data is temporarily stored in memory (use database in production)
- Email passwords should be app-specific passwords

## 🚀 Production Deployment

For production deployment:

1. **Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Email Service**: Consider using SendGrid or AWS SES
3. **File Storage**: Use AWS S3 or similar for PDF storage
4. **Environment**: Set up proper environment variables
5. **SSL**: Ensure HTTPS for webhook endpoints
6. **Monitoring**: Add logging and error tracking

## 🧪 Testing

Test the complete flow:

```bash
# Start both services
npm run dev

# Test with test card: 4242 4242 4242 4242
# Any future date, any CVC
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 

## 🛫 Deployment

### Frontend (Next.js) on Vercel
- Set the project root to the monorepo root in Vercel.
- **Build Command:**
  ```
  cd apps/web && npm install && npm run build
  ```
- **Output Directory:**
  ```
  apps/web/.next
  ```
- Add your frontend environment variables in the Vercel dashboard.

### Backend (Express API)
- Deploy `apps/api` to a Node host (Render, Railway, Fly.io, Heroku, etc).
- **Build Command:**
  ```
  npm install && npm run build
  ```
- **Start Command:**
  ```
  npm run start
  ```
- Add your backend environment variables in the host's dashboard.

## 🗂️ Monorepo Structure

```
1dollardayitinerary/
  apps/
    api/
      .env
      src/
      package.json
    web/
      .env
      app/
      package.json
  packages/
    shared/
      src/
      package.json
  .gitignore
  package.json
  turbo.json
  README.md
``` 