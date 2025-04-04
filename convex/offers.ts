import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from 'openai'; // Import OpenAI
// Import the ChatCompletionTool type
import { ChatCompletionTool } from "openai/resources/chat/completions";

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
  vehicle: string; // Will be needed for TollGuru vehicle type mapping
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

// --- START: Tool Data Structures ---
interface WeatherData {
  temperature?: number; // Celsius
  feelsLike?: number; // Celsius
  description?: string;
  windSpeed?: number; // meter/sec
  humidity?: number; // %
  rainVolumeLastHour?: number; // mm
  snowVolumeLastHour?: number; // mm
  cloudCover?: number; // %
  error?: string; // To report errors back to LLM
}

interface RouteAndTollData {
  distanceMeters?: number;
  durationSeconds?: number; // Based on traffic if available
  tollCost?: number;
  tollCurrency?: string;
  error?: string; // To report errors back to LLM
}
// --- END: Tool Data Structures ---

// Initialize OpenAI client
// IMPORTANT: Ensure OPENAI_API_KEY is set in your Convex project's environment variables!
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AiEvaluationResult {
  rank: number;
  reason: string; // This reason should now potentially include info from tools
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

// --- START: Tool Implementation Functions ---

// Helper to get OpenWeatherMap API key
const getOpenWeatherMapApiKey = (): string | undefined => {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    console.error("OPENWEATHER_API_KEY environment variable not set in Convex.");
  }
  return key;
};

// Helper to get Google Maps API key
const getGoogleMapsApiKey = (): string | undefined => {
  const key = process.env.GOOGLEMAPS_API_KEY;
  if (!key) {
    console.error("GOOGLEMAPS_API_KEY environment variable not set in Convex.");
  }
  return key;
};

// Helper to get TollGuru API key
const getTollGuruApiKey = (): string | undefined => {
  const key = process.env.TOLLGURU_API_KEY;
  if (!key) {
    console.error("TOLLGURU_API_KEY environment variable not set in Convex.");
  }
  return key;
};

// Tool implementation for fetching weather
async function _getWeatherForOffer(args: { location: string; date?: string }): Promise<WeatherData> {
  const apiKey = getOpenWeatherMapApiKey();
  if (!apiKey) {
    return { error: "Weather API key not configured." };
  }

  const targetLocation = args.location;
  const targetDateStr = args.date; // YYYY-MM-DD

  console.log(`Fetching weather for: ${targetLocation}${targetDateStr ? ' on ' + targetDateStr : ''}`);

  // --- Date Logic ---
  const today = new Date(); // Use server's current time
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  let targetDate: Date | null = null;
  if (targetDateStr) {
    try {
      targetDate = new Date(targetDateStr + 'T12:00:00Z'); // Assume noon UTC for target date
      if (isNaN(targetDate.getTime())) {
          targetDate = null; // Invalid date format
          console.warn(`Invalid date format received: ${targetDateStr}`);
          return { error: `Invalid date format provided: ${targetDateStr}. Use YYYY-MM-DD.` };
      }
      targetDate.setHours(0, 0, 0, 0); // Normalize
    } catch (e) {
      targetDate = null;
      console.error(`Error parsing date: ${targetDateStr}`, e);
      return { error: `Could not parse date: ${targetDateStr}. Use YYYY-MM-DD.` };
    }
  }

  let daysDifference = 0;
  if (targetDate) {
    daysDifference = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  // --- End Date Logic ---

  try {
    // Decide which API endpoint to use
    if (!targetDate || daysDifference < 0) {
      // Date is in the past or not provided - Fetch current weather as fallback
      console.log(`Date is past or not specified, fetching current weather for ${targetLocation}`);
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetLocation)}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenWeatherMap Current Weather API Error:", errorData);
        return { error: `Failed to fetch current weather: ${response.statusText} - ${errorData?.message}` };
      }
      const data = await response.json();
      // Return current data
       return {
         temperature: data.main?.temp,
         feelsLike: data.main?.feels_like,
         description: data.weather?.[0]?.description,
         windSpeed: data.wind?.speed,
         humidity: data.main?.humidity,
         rainVolumeLastHour: data.rain?.['1h'],
         snowVolumeLastHour: data.snow?.['1h'],
         cloudCover: data.clouds?.all,
       };

    } else if (daysDifference >= 0 && daysDifference <= 5) {
      // Date is within the next 5 days - Fetch 5-day forecast
      console.log(`Date is within 5 days, fetching forecast for ${targetLocation}`);
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(targetLocation)}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenWeatherMap Forecast API Error:", errorData);
        return { error: `Failed to fetch forecast: ${response.statusText} - ${errorData?.message}` };
      }
      const forecastData = await response.json();

      // Find the forecast closest to noon on the target date
      const targetTimestamp = new Date(targetDateStr + 'T12:00:00Z').getTime() / 1000; // Target timestamp in seconds UTC
      let bestForecast = null;
      let minDiff = Infinity;

      if (forecastData.list && Array.isArray(forecastData.list)) {
          for (const item of forecastData.list) {
              const forecastTimestamp = item.dt; // Timestamp in seconds UTC
              const diff = Math.abs(forecastTimestamp - targetTimestamp);
              if (diff < minDiff) {
                  minDiff = diff;
                  bestForecast = item;
              }
          }
      }
      
      if (bestForecast) {
          console.log(`Found forecast entry for ${bestForecast.dt_txt} UTC`);
          return {
              temperature: bestForecast.main?.temp,
              feelsLike: bestForecast.main?.feels_like,
              description: bestForecast.weather?.[0]?.description,
              windSpeed: bestForecast.wind?.speed,
              humidity: bestForecast.main?.humidity,
              // Forecast data uses '3h' key for rain/snow volume
              rainVolumeLastHour: bestForecast.rain?.['3h'], // Use 3h value as estimate for the period
              snowVolumeLastHour: bestForecast.snow?.['3h'],
              cloudCover: bestForecast.clouds?.all,
          };
      } else {
          console.warn(`No suitable forecast found for ${targetDateStr} in API response.`);
          return { error: `Could not find forecast data for ${targetDateStr}.` };
      }

    } else {
      // Date is too far in the future
      console.log(`Date ${targetDateStr} is more than 5 days away.`);
      return { error: "Forecast is only available for the next 5 days with the current plan." };
    }

  } catch (error: any) {
    console.error(`Error calling OpenWeatherMap API for ${targetLocation}:`, error);
    return { error: `Network or other error fetching weather: ${error.message}` };
  }
}

// Tool implementation for fetching route and tolls
async function _getRouteAndTollsForOffer(args: { origin: string; destination: string; vehicleType?: string }): Promise<RouteAndTollData> {
  const googleApiKey = getGoogleMapsApiKey();
  const tollGuruApiKey = getTollGuruApiKey();

  if (!googleApiKey || !tollGuruApiKey) {
    return { error: "API keys for routing or toll calculation are not configured." };
  }

  console.log(`Fetching route & tolls for: ${args.origin} to ${args.destination}, Vehicle: ${args.vehicleType || 'DEFAULT_TRUCK'}`);

  let distanceMeters: number | undefined = undefined;
  let durationSeconds: number | undefined = undefined;
  let tollCost: number | undefined = undefined;
  let tollCurrency: string | undefined = undefined;
  let routeError: string | undefined = undefined;
  let tollError: string | undefined = undefined;

  // 1. Get Route Info from Google Maps Directions API
  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(args.origin)}&destination=${encodeURIComponent(args.destination)}&key=${googleApiKey}&departure_time=now`; // Add departure_time=now for traffic estimation
    const routeResponse = await fetch(googleUrl);
    if (!routeResponse.ok) {
      const errorData = await routeResponse.json();
      console.error("Google Directions API Error:", errorData);
      routeError = `Failed to fetch route: ${routeResponse.statusText} - ${errorData?.error_message || errorData?.status}`;
    } else {
      const routeData = await routeResponse.json();
      if (routeData.status === "OK" && routeData.routes?.[0]?.legs?.[0]) {
        distanceMeters = routeData.routes[0].legs[0].distance?.value;
        // Get duration_in_traffic if available, otherwise fallback to duration
        durationSeconds = routeData.routes[0].legs[0].duration_in_traffic?.value ?? routeData.routes[0].legs[0].duration?.value;
      } else {
         routeError = `No route found or error in Google response: ${routeData.status} - ${routeData.error_message || ''}`;
         console.error("Google Directions API - No valid route:", routeData);
      }
    }
  } catch (error: any) {
    console.error("Error calling Google Directions API:", error);
    routeError = `Network or other error fetching route: ${error.message}`;
  }

  // 2. Get Toll Info from TollGuru API
  // Mapping basic vehicle info to TollGuru types - NEEDS EXPANSION based on actual offer.vehicle data
  let tollGuruVehicleType = "2AxlesAuto"; // Default fallback
  const vehicleTypeLower = args.vehicleType?.toLowerCase() || '';
  if (vehicleTypeLower.includes('truck') || vehicleTypeLower.includes('semi')) {
      tollGuruVehicleType = "5AxlesTruck"; // Example, needs refinement
  } else if (vehicleTypeLower.includes('van')) {
      tollGuruVehicleType = "2AxlesTruck";
  }
  // Add more specific mappings based on your expected `offer.vehicle` strings

  try {
    const tollGuruUrl = `https://apis.tollguru.com/toll/v2/origin-destination-waypoints`;
    const tollResponse = await fetch(tollGuruUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tollGuruApiKey,
      },
      body: JSON.stringify({
        from: { address: args.origin },
        to: { address: args.destination },
        vehicleType: tollGuruVehicleType,
        departureTime: new Date().toISOString(), // Use current time
      }),
    });

    if (!tollResponse.ok) {
       const errorText = await tollResponse.text(); // Read text as error might not be JSON
       console.error("TollGuru API Error:", tollResponse.status, errorText);
       tollError = `Failed to fetch tolls: ${tollResponse.statusText} - ${errorText}`;
    } else {
      const tollData = await tollResponse.json();
      // TollGuru structure correction: Costs are often within routes[0]
      const routeSummary = tollData?.routes?.[0]?.summary;
      const routeCosts = tollData?.routes?.[0]?.costs;

      if (routeCosts?.tag !== undefined && routeCosts?.tag !== null) { // Check tag cost first
        tollCost = routeCosts.tag;
        tollCurrency = routeCosts.currency || tollData?.summary?.currency; // Get currency from routeCosts or summary
      } else if (routeCosts?.cash !== undefined && routeCosts?.cash !== null) { // Fallback to cash
        tollCost = routeCosts.cash;
        tollCurrency = routeCosts.currency || tollData?.summary?.currency;
      } else {
          console.log("TollGuru: Toll cost not found in routes[0].costs in response:", tollData);
          // Toll might legitimately be zero, don't necessarily set an error
          if (routeSummary?.hasTolls === false) {
              tollCost = 0;
              tollCurrency = routeCosts?.currency || tollData?.summary?.currency;
          } else {
             // Only set error if tolls were expected but not found
             tollError = "Toll cost data not found in TollGuru response structure.";
          }
      }
    }
  } catch (error: any) {
    console.error("Error calling TollGuru API:", error);
    tollError = `Network or other error fetching tolls: ${error.message}`;
  }

  // Combine results and potential errors
  const combinedError = [routeError, tollError].filter(e => e).join('; ');
  return {
    distanceMeters,
    durationSeconds,
    tollCost,
    tollCurrency,
    error: combinedError || undefined, // Only include error key if there was an error
  };
}

// --- END: Tool Implementation Functions ---

// --- START: Tool Definitions for LLM ---
// Base definitions
const weatherToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getWeatherForOffer",
    description: "Fetches current or forecasted weather conditions for a specific location (origin, destination, or key waypoint) relevant to a transport offer. Use this to assess potential weather-related risks or delays.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city or address for which to get the weather (e.g., 'Berlin, Germany', 'Paris Charles de Gaulle Airport').",
        },
        date: {
          type: "string",
          description: "Optional: The target date for the weather forecast in YYYY-MM-DD format. If omitted or for today, current weather is fetched.", // Updated description slightly
        },
      },
      required: ["location"],
    },
  },
};

// Combined tool definition (remains useful)
const routeTollsToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getRouteAndTollsForOffer",
    description: "Calculates estimated route distance, driving time (considering traffic), AND toll costs for a commercial freight vehicle between an origin and destination. Prefer this if you need BOTH route and toll information.", // Updated description
    parameters: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "The starting address or city (e.g., 'Warsaw, Poland').",
        },
        destination: {
          type: "string",
          description: "The ending address or city (e.g., 'Hamburg, Germany').",
        },
        vehicleType: {
          type: "string",
          description: "Optional: A description of the vehicle type from the offer (e.g., 'Standard Semi-Truck', 'Refrigerated Van', 'Curtain Sider 13.6m'). Used to improve toll calculation accuracy.",
        },
      },
      required: ["origin", "destination"],
    },
  },
};

// --- NEW: Separate Tool Definitions ---
const routeDataOnlyToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getRouteDataOnly",
    description: "Calculates estimated route distance and driving time (considering traffic) for a commercial freight vehicle. Use this if you ONLY need route information (distance/time) and not tolls.",
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string", description: "The starting address or city." },
        destination: { type: "string", description: "The ending address or city." },
        // Vehicle type might still influence traffic/routing slightly, keep optional
        vehicleType: { type: "string", description: "Optional: Description of vehicle (e.g., 'Standard Semi-Truck')." },
      },
      required: ["origin", "destination"],
    },
  },
};

const tollDataOnlyToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getTollDataOnly",
    description: "Calculates estimated toll costs for a commercial freight vehicle route. Use this if you ONLY need toll cost information and not distance/time.",
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string", description: "The starting address or city." },
        destination: { type: "string", description: "The ending address or city." },
        vehicleType: { type: "string", description: "Optional but recommended: Description of vehicle (e.g., 'Standard Semi-Truck') for accuracy." },
      },
      required: ["origin", "destination"],
    },
  },
};
// --- END: New Separate Tool Definitions ---

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
    // --- Updated tool preferences args ---
    useWeatherTool: v.boolean(),
    useRouteTool: v.boolean(), // New
    useTollsTool: v.boolean(), // New
    // --- Remove old arg ---
    // useRouteTollsTool: v.boolean(), 
  },
  handler: async (ctx, args) => {
    console.log(`Backend: Agentic evaluation request received. Filters:`, args.filters, `Tool Prefs: Weather=${args.useWeatherTool}, Route=${args.useRouteTool}, Tolls=${args.useTollsTool}`);
    const openaiApiKey = process.env.OPENAI_API_KEY;
    // Check essential keys early
    if (!openaiApiKey) throw new Error("OpenAI API key not configured.");
    if (args.useWeatherTool && !getOpenWeatherMapApiKey()) console.warn("Weather tool enabled, but OpenWeatherMap API key missing.");
    // Check route/toll keys only if respective tools are enabled
    if (args.useRouteTool && !getGoogleMapsApiKey()) console.warn("Route tool enabled, but Google Maps API key missing.");
    if (args.useTollsTool && !getTollGuruApiKey()) console.warn("Tolls tool enabled, but TollGuru API key missing.");

    const { filters, offers, useWeatherTool, useRouteTool, useTollsTool } = args; // Destructure new args
    const offersTyped = offers as TransportOffer[];

    if (offersTyped.length === 0) {
      console.log("Backend: No offers to evaluate.");
      return {};
    }

    // --- Updated conditional tool building logic ---
    const availableTools: ChatCompletionTool[] = [];
    const toolDescriptions: string[] = [];
    if (useWeatherTool) {
      availableTools.push(weatherToolDefinition);
      if (weatherToolDefinition.function.description) {
        toolDescriptions.push(weatherToolDefinition.function.description);
      }
    }
    let combinedRouteTollAvailable = false;
    if (useRouteTool && useTollsTool) {
      // If both route and tolls are enabled, offer the combined tool
      availableTools.push(routeTollsToolDefinition);
      if (routeTollsToolDefinition.function.description) {
        toolDescriptions.push(routeTollsToolDefinition.function.description + " (Recommended if both needed)");
      }
      combinedRouteTollAvailable = true;
      // Also offer individual tools as fallbacks or specific requests
       availableTools.push(routeDataOnlyToolDefinition);
       if (routeDataOnlyToolDefinition.function.description) {
         toolDescriptions.push(routeDataOnlyToolDefinition.function.description);
       }
       availableTools.push(tollDataOnlyToolDefinition);
       if (tollDataOnlyToolDefinition.function.description) {
         toolDescriptions.push(tollDataOnlyToolDefinition.function.description);
       }
    } else {
      // If only one is enabled, offer only that specific tool
      if (useRouteTool) {
        availableTools.push(routeDataOnlyToolDefinition);
        if (routeDataOnlyToolDefinition.function.description) {
          toolDescriptions.push(routeDataOnlyToolDefinition.function.description);
        }
      }
      if (useTollsTool) {
        availableTools.push(tollDataOnlyToolDefinition);
        if (tollDataOnlyToolDefinition.function.description) {
          toolDescriptions.push(tollDataOnlyToolDefinition.function.description);
        }
      }
    }
    const availableToolsString = toolDescriptions.length > 0 
      ? toolDescriptions.map(d => `- ${d}`).join('\n    ')
      : "No external tools are enabled for this evaluation.";
    // -------------------------------------------------

    // 1. Format Initial Prompt and Offer Data for Agent
    const offerDetails = offersTyped.map((offer, index) =>
      `Offer ${index + 1} (ID: ${offer.id}):\n` +
      `  Route: ${offer.origin} to ${offer.destination}\n` +
      `  Distance (Listed): ${offer.distance}\n` + // Note: Agent might verify/recalculate this
      `  Price: ${offer.price}\n` +
      `  Carrier: ${offer.carrier} (Rating: ${offer.rating ?? 'N/A'})\n` +
      `  Platform: ${offer.platform}\n` +
      `  Dates: Load ${offer.loadingDate}, Deliver ${offer.deliveryDate}\n` +
      `  Load Type: ${offer.loadType}\n` +
      `  Vehicle: ${offer.vehicle}\n` + // Pass vehicle info
      `  Weight: ${offer.weight}\n` +
      `  Status: ${offer.status}\n` +
      `  Description: ${offer.description || 'N/A'}`
    ).join('\n---\n');

    // Update system prompt to reflect available tools and guidance
    const initialSystemPrompt = `You are an advanced AI logistics agent. Your task is to evaluate transport offers based on user criteria and enabled tools.

    User Search Criteria:
    Keywords: ${filters.searchTerm || 'None'}
    Origin Filter: ${filters.originFilter || 'Any'}
    Destination Filter: ${filters.destinationFilter || 'Any'}
    Platform: ${filters.platformFilter || 'Any'}
    Status: ${filters.statusFilter || 'Any'}
    Price Range: €${filters.minPrice || '0'} - €${filters.maxPrice || 'Any'}
    Load Type: ${filters.loadTypeFilter || 'Any'}
    Current Sort Preference (User's view): ${filters.sortBy}

    Enabled Tools for this evaluation:
    ${availableToolsString}

    Tool Usage Guidance:
    ${combinedRouteTollAvailable ? '- If you need BOTH route data (distance/time) AND toll costs for the same route, PREFER using the combined \`getRouteAndTollsForOffer\` tool for efficiency.\n' : ''}    - Use the specific tools (\`getRouteDataOnly\`, \`getTollDataOnly\`) if you only need one piece of information or if the combined tool is unavailable.

    Evaluation Process:
    1. Analyze the offers and user criteria.
    2. **If tools are enabled, proactively use them** following the guidance above to gather essential context.
    3. Synthesize offer data, criteria, and any available tool results.
    4. Identify the top 3-5 offers.
    5. **Return ONLY a valid JSON object** (keys=offer IDs, values={rank, reason}).
    6. Base the **reason** on available data, mentioning insights gained IF tools were used and acknowledging limitations if tools were disabled or failed.

    Example Output Format:
    {
      "TR-123": { "rank": 1, "reason": "Good price. Used getRouteAndTolls: time ~8hr, tolls €25. Weather okay." },
      "TR-456": { "rank": 2, "reason": "Used getRouteDataOnly: time ~9hr. Toll tool disabled." }
    }`;

    // --- Function Calling Loop ---
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: initialSystemPrompt },
      { role: "user", content: `Here are the transport offers:\n\n${offerDetails}\n\nPlease evaluate these offers ${availableTools.length > 0 ? 'using the enabled tools' : 'based only on the provided data'} and provide your ranked results in the specified JSON format.` } // Adjust user prompt based on tools
    ];

    console.log("Backend: Starting agent interaction with OpenAI...");
    let loopCount = 0;
    const maxLoops = 10; 

    try {
      while (loopCount < maxLoops) {
        loopCount++;
        console.log(`Backend: Agent Loop ${loopCount}, sending ${messages.length} messages.`);

        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview", // Recommended model
          messages: messages,
          tools: availableTools.length > 0 ? availableTools : undefined,
          tool_choice: availableTools.length > 0 ? "auto" : undefined, 
          temperature: 0.3,
          response_format: { type: "json_object" }, 
        });

        const responseMessage = completion.choices[0]?.message;

        if (!responseMessage) {
          throw new Error("No response message received from OpenAI.");
        }

        messages.push(responseMessage);

        const toolCalls = responseMessage.tool_calls;
        if (toolCalls && availableTools.length > 0) {
          console.log(`Backend: Agent requests ${toolCalls.length} tool call(s).`);

          // --- Updated Parallel Tool Execution Logic ---
          const toolExecutionPromises = toolCalls.map(async (toolCall) => {
            const baseResult = { id: toolCall?.id || 'unknown', name: 'unknown' };
            if (toolCall.type !== "function") {
              return { ...baseResult, status: 'rejected' as const, reason: new Error('Non-function tool call') };
            }

            const functionName = toolCall.function.name;
            const functionArgs = tryParseJson(toolCall.function.arguments);
            const currentResult = { ...baseResult, id: toolCall.id, name: functionName };

            if (!functionArgs) {
              return { ...currentResult, status: 'rejected' as const, reason: new Error(`Invalid args: ${toolCall.function.arguments}`) };
            }

            console.log(`Backend: Starting tool ${functionName} with args:`, functionArgs);

            try {
              let resultValue: any; // Use 'any' for flexibility before filtering

              // Determine which underlying function to call and filter results
              if (functionName === "getWeatherForOffer") {
                resultValue = await _getWeatherForOffer(functionArgs as { location: string; date?: string });
              } else if (functionName === "getRouteAndTollsForOffer" || functionName === "getRouteDataOnly" || functionName === "getTollDataOnly") {
                // All three route/toll tools use the same internal function
                const fullResult: RouteAndTollData = await _getRouteAndTollsForOffer(functionArgs as { origin: string; destination: string; vehicleType?: string });
                
                // Filter the result based on the tool called
                if (functionName === "getRouteDataOnly") {
                  resultValue = {
                    distanceMeters: fullResult.distanceMeters,
                    durationSeconds: fullResult.durationSeconds,
                    error: fullResult.error // Pass along any errors that occurred
                  };
                } else if (functionName === "getTollDataOnly") {
                  resultValue = {
                    tollCost: fullResult.tollCost,
                    tollCurrency: fullResult.tollCurrency,
                    error: fullResult.error // Pass along any errors that occurred
                  };
                } else { // getRouteAndTollsForOffer
                  resultValue = fullResult; // Return the whole thing
                }
              } else {
                throw new Error(`Unknown tool function: ${functionName}`);
              }
              return { ...currentResult, status: 'fulfilled' as const, value: resultValue };
            } catch (error: any) {
              return { ...currentResult, status: 'rejected' as const, reason: error };
            }
          });

          const settledToolResults = await Promise.all(toolExecutionPromises);
          console.log(`Backend: Finished parallel execution of ${settledToolResults.length} tool(s).`);

          // Process results (no change needed here, already handles fulfilled/rejected)
          settledToolResults.forEach((result) => {
            let toolResultContent: string;

            if (result.status === 'fulfilled') {
              toolResultContent = JSON.stringify(result.value);
              console.log(`Backend: Tool ${result.name} (ID: ${result.id}) succeeded.`);
            } else {
              // Handle rejected tools (invalid args, execution errors, unknown tools)
              console.error(`Backend: Tool ${result.name} (ID: ${result.id}) failed:`, result.reason);
              // Ensure reason is serializable
              const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
              toolResultContent = JSON.stringify({ error: `Error executing tool ${result.name}: ${errorMessage}` });
            }

            messages.push({
              tool_call_id: result.id, 
              role: "tool",
              content: toolResultContent,
            });
          });
          // --- End Parallel Tool Execution ---

          continue;
        } else if (responseMessage.content) {
          console.log("Backend: Agent finished interaction. Received final content.");

          const parsedResults = tryParseJson(responseMessage.content);

          if (!parsedResults || typeof parsedResults !== 'object') {
              console.error("Backend: Failed to parse final JSON response from agent or invalid format:", responseMessage.content);
              throw new Error("Failed to parse JSON response from AI agent or invalid format.");
          }

          // Basic validation (can be enhanced)
          for (const offerId in parsedResults) {
              if (typeof parsedResults[offerId] !== 'object' ||
                  typeof parsedResults[offerId].rank !== 'number' ||
                  typeof parsedResults[offerId].reason !== 'string') {
                  console.warn(`Invalid structure for offer ID ${offerId} in agent response`, parsedResults[offerId]);
                  throw new Error("AI agent response structure is invalid.");
              }
          }

          console.log("Backend: Agent Response Parsed Successfully", parsedResults);
          return parsedResults as Record<string, AiEvaluationResult>; // Return final results

        } else {
           // Handle cases where model might respond with empty content or only tool calls when none were expected
           if (toolCalls && availableTools.length === 0) {
              console.warn("Backend: Agent attempted tool call, but no tools were enabled.");
              // Force continuation without tool processing or throw error
              throw new Error("Agent attempted tool call unexpectedly.");
           } else {
              throw new Error("OpenAI response contained neither tool calls nor content.");
           }
        }
      } // end while loop

      // If loop exited due to maxLoops
      if (loopCount >= maxLoops) {
          console.error("Backend: Agent exceeded maximum tool call loops.");
          throw new Error("AI agent exceeded maximum interaction cycles.");
      }

      // Should not be reached if logic is correct
      throw new Error("Agent interaction loop finished unexpectedly.");

    } catch (error: any) {
      console.error("Backend: Agent Interaction Error:", error);
      const errorMessage = error.message?.includes("rate limit")
        ? "AI evaluation failed due to rate limits. Please try again later."
        : error.message?.includes("API key") // Catch key issues broadly
        ? "AI evaluation failed due to an issue with an API key configuration."
        : `Failed to get evaluation from AI agent: ${error.message}`;
      throw new Error(errorMessage);
    }
  },
}); 