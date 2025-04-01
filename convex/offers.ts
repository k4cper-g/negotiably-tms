import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from 'openai'; // Import OpenAI

// Define the TransportOffer type directly in the backend
// Based on the definition found in src/app/(main)/offers/page.tsx
interface TransportOffer {
  id: string;
  origin: string;
  originCoords?: string; // Optional as it might not always be needed/available for backend logic
  destination: string;
  destinationCoords?: string; // Optional
  distance: string;
  price: string;
  pricePerKm?: string; // Optional
  carrier: string;
  loadType: string;
  vehicle: string;
  weight: string;
  dimensions: string;
  loadingDate: string;
  deliveryDate: string;
  status: string;
  platform: string;
  lastUpdated?: string; // Optional
  dateCreated?: string; // Optional
  description?: string; // Optional
  contact?: string; // Optional
  rating?: number; // Optional
}

// Initialize OpenAI client
// IMPORTANT: Ensure OPENAI_API_KEY is set in your Convex project's environment variables!
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AiEvaluationResult {
  rank: number;
  reason: string;
}

// Helper to safely parse JSON
function tryParseJson(jsonString: string | null | undefined): any | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}

export const evaluateOffers = action({
  args: {
    filters: v.object({
      searchTerm: v.string(),
      originFilter: v.string(),
      destinationFilter: v.string(),
      platformFilter: v.string(),
      statusFilter: v.string(),
      minPrice: v.string(),
      maxPrice: v.string(),
      loadTypeFilter: v.string(),
      sortBy: v.string(),
      maxResults: v.number(),
    }),
    offers: v.array(v.any()), 
  },
  handler: async (ctx, args) => {
    console.log("Backend: Received evaluation request with filters:", args.filters);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set.");
      throw new Error("OpenAI API key is not configured. Please set it in Convex environment variables.");
    }

    const { filters, offers } = args;
    const offersTyped = offers as TransportOffer[]; 

    if (offersTyped.length === 0) {
      console.log("Backend: No offers to evaluate.");
      return {}; // Return empty results if no offers
    }

    // 1. Format the Prompt:
    const offerDetails = offersTyped.map((offer, index) => 
      `Offer ${index + 1} (ID: ${offer.id}):
       Route: ${offer.origin} to ${offer.destination}
       Distance: ${offer.distance}
       Price: ${offer.price}
       Carrier: ${offer.carrier} (Rating: ${offer.rating ?? 'N/A'})
       Platform: ${offer.platform}
       Dates: Load ${offer.loadingDate}, Deliver ${offer.deliveryDate}
       Load Type: ${offer.loadType}
       Vehicle: ${offer.vehicle}
       Weight: ${offer.weight}
       Status: ${offer.status}
      `).join('\n---\n');

    const prompt = `You are an AI assistant evaluating transport offers for a logistics company. Analyze the following ${offersTyped.length} offers based on the user's search criteria and rank the top 3 most suitable options. Consider factors like price, distance, carrier reputation (if available), load type match, dates, and platform.

    User Search Criteria:
    Keywords: ${filters.searchTerm || 'None'}
    Origin: ${filters.originFilter || 'Any'}
    Destination: ${filters.destinationFilter || 'Any'}
    Platform: ${filters.platformFilter || 'Any'}
    Status: ${filters.statusFilter || 'Any'}
    Price Range: €${filters.minPrice || '0'} - €${filters.maxPrice || 'Any'}
    Load Type: ${filters.loadTypeFilter || 'Any'}
    Current Sort Preference: ${filters.sortBy}

    Transport Offers:
    ${offerDetails}

    Instructions:
    1. Evaluate all provided offers against the search criteria.
    2. Identify the top 3 offers that best match the criteria.
    3. For each of the top 3, provide a rank (1, 2, 3) and a brief, concise reason (1-2 sentences) explaining why it was chosen (e.g., best price, fastest route, good carrier reputation, best match for load type).
    4. Return ONLY a valid JSON object where the keys are the offer IDs (e.g., "TR-2587") of the top 3 offers, and the values are objects containing "rank" (number) and "reason" (string).
    Example format: { "TR-2587": { "rank": 1, "reason": "Excellent price per km and direct route." }, "TR-2586": { "rank": 2, "reason": "Good balance of price and reliable carrier." }, "TR-2585": { "rank": 3, "reason": "Matches specific temperature control requirement." } }
    If fewer than 3 offers are provided, rank as many as possible.
    `;

    console.log("Backend: Sending prompt to OpenAI...");
    // console.log(prompt); // Uncomment for debugging the prompt

    // 2. Call OpenAI API:
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125", // Use a model that supports JSON mode well
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2, // Lower temperature for more deterministic ranking
        response_format: { type: "json_object" }, // Request JSON output
      });

      const resultJson = completion.choices[0]?.message?.content;
      console.log("Backend: Received raw response from OpenAI:", resultJson);

      if (!resultJson) {
         throw new Error("No content received from OpenAI");
      }

      // 3. Parse and Validate Response
      const parsedResults = tryParseJson(resultJson);

      if (!parsedResults || typeof parsedResults !== 'object') {
        throw new Error("Failed to parse JSON response from OpenAI or invalid format.");
      }

      // Basic validation of the parsed structure
      for (const offerId in parsedResults) {
        if (typeof parsedResults[offerId] !== 'object' || 
            typeof parsedResults[offerId].rank !== 'number' || 
            typeof parsedResults[offerId].reason !== 'string') {
          console.warn(`Invalid structure for offer ID ${offerId} in OpenAI response`, parsedResults[offerId]);
          throw new Error("OpenAI response structure is invalid.");
        }
      }

      console.log("Backend: OpenAI Response Parsed Successfully", parsedResults);
      return parsedResults as Record<string, AiEvaluationResult>; // Return the parsed results

    } catch (error: any) {
      console.error("Backend: OpenAI API Error or Parsing Failed:", error);
      // Provide a more informative error message back to the frontend
      const errorMessage = error.message?.includes("rate limit") 
        ? "AI evaluation failed due to rate limits. Please try again later."
        : error.message?.includes("OPENAI_API_KEY")
        ? "AI evaluation failed due to an issue with the API key configuration."
        : "Failed to get evaluation from AI. Please check backend logs.";
      throw new Error(errorMessage); // Propagate error to frontend
    }

    // Removed Placeholder Response 
    // console.log("Backend: Returning dummy results");
    // ... dummy results logic ...
    // await new Promise(resolve => setTimeout(resolve, 1000)); 
    // return dummyResults;
  },
}); 