import { action } from "./_generated/server";
import { v } from "convex/values";

// Define the expected structure of the weather data returned by OpenWeatherMap
interface WeatherResponse {
  name: string;
  main: {
    temp: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
}

// Define the structure of the data we want to return from our query
interface CityWeatherData {
  city: string;
  temp: number;
  description: string;
  iconCode: string;
}

export const getWeatherForCities = action({
  args: { cities: v.array(v.string()) },
  handler: async (_, args): Promise<(CityWeatherData | null)[]> => {
    // Basic validation: ensure cities array is not empty
    if (!args.cities || args.cities.length === 0) {
        console.log("No cities provided to getWeatherForCities.");
        return []; // Return empty if no cities requested
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeatherMap API key is not configured.");
      // Return null for all requested cities if API key is missing
      return args.cities.map((city) => null);
    }

    const fetchPromises = args.cities.map(async (city) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch weather for ${city}: ${response.statusText}`);
          return null; // Return null for this city on API error
        }
        const data: WeatherResponse = await response.json();

        // Log the raw data specifically for Berlin for debugging
        if (city.toLowerCase() === 'berlin') {
          console.log(`Raw Berlin Weather Data:`, JSON.stringify(data, null, 2));
        }

        if (data && data.main && data.weather && data.weather.length > 0) {
          return {
            city: data.name,
            temp: Math.round(data.main.temp), // Round temperature
            description: data.weather[0].description,
            iconCode: data.weather[0].icon,
          };
        } else {
          console.error(`Unexpected response structure for ${city}`);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching weather for ${city}:`, error);
        return null; // Return null for this city on network or parsing error
      }
    });

    const results = await Promise.all(fetchPromises);
    return results;
  },
}); 