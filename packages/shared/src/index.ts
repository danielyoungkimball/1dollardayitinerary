export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

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

/**
 * Default prompt template for itinerary generation.
 * Use only the following placeholders: ${city}, ${date}, ${start}, ${end}, ${interests}.
 * Do NOT use JavaScript code or variable names like ${formData.city} in the string.
 * To add more variables, update both this template and the fillPromptTemplate function in the backend.
 */
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