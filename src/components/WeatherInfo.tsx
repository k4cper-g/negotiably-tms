'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Import the expanded set of Lucide icons requested
import {
  Sun, Moon, CloudSun, CloudMoon, Cloudy, // Use Cloudy for 03, 04
  CloudDrizzle, CloudRain, CloudLightning, CloudSnow, Haze, // Use Haze for 50
  CloudSunRain, CloudMoonRain, AlertCircle // Specific day/night rain + fallback
} from 'lucide-react';
import type { FunctionReturnType } from "convex/server";
import type { LucideProps } from 'lucide-react';

// Define component props
interface WeatherInfoProps {
  cities: string[];
}

// Define expected type for a single city's weather data (matching backend)
// This helps type the 'data' variable in the map function
type CityWeatherData = FunctionReturnType<typeof api.weather.getWeatherForCities>[number];

// Refined mapping using the requested icons
const getWeatherIconComponent = (iconCode: string): React.ComponentType<LucideProps> => {
  const codePrefix = iconCode.substring(0, 2);
  const isNight = iconCode.endsWith('n');

  switch (codePrefix) {
    case '01': return isNight ? Moon : Sun;
    case '02': return isNight ? CloudMoon : CloudSun;
    case '03':
    case '04': return Cloudy; // Use Cloudy for scattered/broken clouds
    case '09': return CloudDrizzle; // Shower rain
    case '10': return isNight ? CloudMoonRain : CloudSunRain; // Day/Night specific rain
    case '11': return CloudLightning; // Thunderstorm
    case '13': return CloudSnow; // Snow
    case '50': return Haze; // Mist, Haze, Fog etc.
    default: return AlertCircle; // Fallback
  }
};

// Utility function to find cities that need to be fetched
const getNewCitiesToFetch = (currentCities: string[], cachedData: Record<string, CityWeatherData | null>): string[] => {
  return currentCities.filter(city => !(city in cachedData));
};

const WeatherInfo: React.FC<WeatherInfoProps> = ({ cities }) => {
  // Use useAction hook
  const performGetWeather = useAction(api.weather.getWeatherForCities);

  // Cache of weather data by city
  const [weatherCache, setWeatherCache] = useState<Record<string, CityWeatherData | null>>({});
  
  // Track loading state per city
  const [loadingCities, setLoadingCities] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Add a flag for initial loading
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // For tracking data staleness - refresh cache after expiry time
  const lastFetchTimestamps = useRef<Record<string, number>>({});
  const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

  // Effect depends on the cities prop now
  useEffect(() => {
    // Only fetch if there are cities requested
    if (!cities || cities.length === 0) {
      setInitialFetchDone(true);
      return;
    }

    // Find which cities need to be fetched (not in cache or cache expired)
    const now = Date.now();
    const citiesToFetch = cities.filter(city => {
      const timestamp = lastFetchTimestamps.current[city] || 0;
      return !(city in weatherCache) || (now - timestamp > CACHE_EXPIRY_MS);
    });

    if (citiesToFetch.length === 0) {
      setInitialFetchDone(true);
      return; // All cities already cached with fresh data
    }

    // Update loading state for cities being fetched
    setLoadingCities(prev => {
      const newState = { ...prev };
      citiesToFetch.forEach(city => {
        newState[city] = true;
      });
      return newState;
    });

    const fetchWeather = async () => {
      setError(null);
      try {
        // Only fetch data for cities not in cache or with expired cache
        const result = await performGetWeather({ cities: citiesToFetch });
        
        // Update timestamps for fetched cities
        const currentTime = Date.now();
        citiesToFetch.forEach((city, i) => {
          lastFetchTimestamps.current[city] = currentTime;
        });
        
        // Update cache with new data
        setWeatherCache(prev => {
          const newCache = { ...prev };
          citiesToFetch.forEach((city, i) => {
            newCache[city] = result[i];
          });
          return newCache;
        });
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Failed to load weather data.");
      } finally {
        // Clear loading state for fetched cities
        setLoadingCities(prev => {
          const newState = { ...prev };
          citiesToFetch.forEach(city => {
            delete newState[city];
          });
          return newState;
        });
        setInitialFetchDone(true);
      }
    };
    
    fetchWeather();
  }, [cities, performGetWeather, weatherCache]);

  // Handle case where no cities are selected
  if (!cities || cities.length === 0) {
    return null; // Render nothing if no cities are configured
  }

  // Render state (mix of cached and loading data)
  return (
    <TooltipProvider delayDuration={100}> 
      <div className="flex items-center gap-3 text-sm">
        {cities.map((cityName) => {
          // Only show loading skeleton while fetching
          if (loadingCities[cityName]) {
            return (
              <div
                key={cityName}
                className="h-8 w-24 bg-muted text-muted-foreground rounded-full animate-pulse"
              />
            );
          }
          
          // Get data from cache
          const data = weatherCache[cityName];
          
          // If no data for this city and we've completed the initial fetch, show error
          if (!data && initialFetchDone) {
            return (
              <div
                key={`error-${cityName}`}
                className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-3 py-1 h-8 text-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{cityName}: Error</span>
              </div>
            );
          }
          
          // If data is undefined but we're still in initial loading, show loading skeleton
          if (!data && !initialFetchDone) {
            return (
              <div
                key={`loading-${cityName}`}
                className="h-8 w-24 bg-muted text-muted-foreground rounded-full animate-pulse"
              />
            );
          }
          
          // Get the Lucide Icon Component Type
          const IconComponent = getWeatherIconComponent(data!.iconCode);
          const tooltipText = `${data!.city}: ${data!.description}`;

          return (
            <Tooltip key={data!.city}> 
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full pl-2 pr-3 py-1 h-8 cursor-default"
                >
                  <IconComponent className="w-4 h-4" /> 
                  <span>{data!.city}: <span className="font-semibold text-foreground">{data!.temp}°C</span></span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default WeatherInfo; 