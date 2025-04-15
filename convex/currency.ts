import { action } from "./_generated/server";
import { v } from "convex/values";

// Define the structure of the expected response from fxrates.com
// Assuming it returns rates as numbers directly
interface FxRatesResponse {
  base: string;
  date: string;
  rates: {
    [key: string]: number; 
  };
  // Add other potential fields if known, like success/timestamp
  // success?: boolean;
  // timestamp?: number;
}

// Define the structure for the returned rates - now dynamic
type DynamicExchangeRates = Record<string, number | null>;

export const getExchangeRates = action({
  // Update args: currencies are now required from frontend
  args: { currencies: v.array(v.string()) }, 
  // Update return type
  handler: async (_, args): Promise<DynamicExchangeRates> => { 
    // Basic validation
    if (!args.currencies || args.currencies.length === 0) {
        console.log("No currencies provided to getExchangeRates.");
        return {}; // Return empty object if no currencies requested
    }

    const apiKey = process.env.FXRATES_API_KEY;
    if (!apiKey) {
      console.error("fxrates.com API key (FXRATES_API_KEY) is not configured.");
      // Return null for all requested currencies
      return args.currencies.reduce((acc, curr) => {
          acc[curr] = null;
          return acc;
      }, {} as DynamicExchangeRates);
    }

    // Build symbolsParam from args
    const symbolsParam = args.currencies.join(","); 
    const url = `https://api.fxratesapi.com/latest?apiKey=${apiKey}&base=EUR&symbols=${symbolsParam}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        let errorBody = await response.text().catch(() => "Failed to read error body");
        console.error(`Failed to fetch exchange rates from fxrates.com: ${response.status} ${response.statusText}`, errorBody);
        return args.currencies.reduce((acc, curr) => {
            acc[curr] = null;
            return acc;
        }, {} as DynamicExchangeRates);
      }
      const data: FxRatesResponse = await response.json();

      if (!data || !data.rates) {
          console.error("Unexpected response structure from fxrates.com API");
          return args.currencies.reduce((acc, curr) => {
            acc[curr] = null;
            return acc;
          }, {} as DynamicExchangeRates);
      }
      
      // Build dynamic result object
      const rates: DynamicExchangeRates = {};
      for (const currency of args.currencies) {
          rates[currency] = data.rates[currency] ?? null;
      }

      return rates;

    } catch (error) {
      console.error("Error fetching exchange rates from fxrates.com:", error);
      return args.currencies.reduce((acc, curr) => {
        acc[curr] = null;
        return acc;
      }, {} as DynamicExchangeRates);
    }
  },
}); 