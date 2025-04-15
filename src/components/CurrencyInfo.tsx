'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Import more potential currency icons
import { 
  Euro, PoundSterling, DollarSign, Landmark, 
  Info, Bitcoin, CreditCard, AlertCircle 
} from 'lucide-react';
import type { FunctionReturnType } from "convex/server";
import type { LucideProps } from 'lucide-react'; // Import LucideProps type

// Type for the data returned by the action
type ExchangeRates = Record<string, number | null>;

// Helper to format rates
const formatRate = (rate: number | null): string => {
  if (rate === null || typeof rate !== 'number') {
    return 'N/A';
  }
  return rate.toFixed(4); // Format to 4 decimal places
};

// Remove hardcoded CURRENCY_CONFIG
// const CURRENCY_CONFIG = { ... };

// Simple mapping from currency symbol to icon component type
const getCurrencyIconComponent = (currencyCode: string): React.ComponentType<LucideProps> => {
  switch (currencyCode.toUpperCase()) {
    case 'USD': return DollarSign;
    case 'EUR': return Euro; // Although base is EUR, might be requested
    case 'GBP': return PoundSterling;
    case 'PLN': return Landmark; // Still using Landmark as proxy
    case 'JPY': return Info; // Using Info for JPY since Yen isn't available
    case 'BTC': return Bitcoin;
    default: return CreditCard; // Fallback
  }
};

// Define component props
interface CurrencyInfoProps {
  currencies: string[];
}

const CurrencyInfo: React.FC<CurrencyInfoProps> = ({ currencies }) => {
  const performGetRates = useAction(api.currency.getExchangeRates);

  // Cache of currency data by currency code
  const [currencyCache, setCurrencyCache] = useState<ExchangeRates>({});
  
  // Track loading state per currency
  const [loadingCurrencies, setLoadingCurrencies] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // For tracking data staleness - refresh cache after expiry time
  const lastFetchTimestamps = useRef<Record<string, number>>({});
  const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes (more conservative for rate-limited API)

  useEffect(() => {
    // Only fetch if there are currencies requested
    if (!currencies || currencies.length === 0) {
      return;
    }

    // Find which currencies need to be fetched (not in cache or cache expired)
    const now = Date.now();
    const currenciesToFetch = currencies.filter(currency => {
      const timestamp = lastFetchTimestamps.current[currency] || 0;
      return !(currency in currencyCache) || (now - timestamp > CACHE_EXPIRY_MS);
    });

    if (currenciesToFetch.length === 0) {
      return; // All currencies already cached with fresh data
    }

    // Update loading state for currencies being fetched
    setLoadingCurrencies(prev => {
      const newState = { ...prev };
      currenciesToFetch.forEach(currency => {
        newState[currency] = true;
      });
      return newState;
    });

    const fetchRates = async () => {
      setError(null);
      try {
        // Only fetch data for currencies not in cache or with expired cache
        const result = await performGetRates({ currencies: currenciesToFetch });
        
        // Update timestamps for fetched currencies
        const currentTime = Date.now();
        currenciesToFetch.forEach(currency => {
          lastFetchTimestamps.current[currency] = currentTime;
        });
        
        // Update cache with new data
        setCurrencyCache(prev => {
          const newCache = { ...prev };
          // Handle direct rate mapping from Record<string, number | null>
          Object.assign(newCache, result);
          return newCache;
        });
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
        setError("Failed to load currency data. Rate limit may be exceeded.");
      } finally {
        // Clear loading state for fetched currencies
        setLoadingCurrencies(prev => {
          const newState = { ...prev };
          currenciesToFetch.forEach(currency => {
            delete newState[currency];
          });
          return newState;
        });
      }
    };
    
    fetchRates();
  }, [currencies, performGetRates, currencyCache]);

  // Handle case where no currencies are selected
  if (!currencies || currencies.length === 0) {
    return null; // Render nothing if no currencies are configured
  }

  // Render state (mix of cached and loading data)
  return (
    <TooltipProvider delayDuration={100}> 
      <div className="flex items-center gap-3 text-sm">
        {currencies.map((currencyCode) => {
          // Check if this currency is currently loading
          if (loadingCurrencies[currencyCode]) {
            return (
              <div
                key={currencyCode}
                className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-3 py-1 h-8 animate-pulse w-24"
              >
                <div className="w-5 h-5 bg-muted-foreground/30 rounded-full"></div>
                <div className="w-12 h-4 bg-muted-foreground/30 rounded"></div>
              </div>
            );
          }
          
          // Get data from cache
          const rate = currencyCache[currencyCode];
          
          // If no data for this currency
          if (rate === undefined) {
            return (
              <div
                key={`error-${currencyCode}`}
                className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-full px-3 py-1 h-8 text-xs"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{currencyCode}: Error</span>
              </div>
            );
          }
          
          // Get the Lucide Icon Component
          const IconComponent = getCurrencyIconComponent(currencyCode);
          const formattedRate = formatRate(rate);
          const tooltipText = `${currencyCode} to EUR: ${formattedRate}`;

          return (
            <Tooltip key={currencyCode}> 
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full pl-2 pr-3 py-1 h-8 cursor-default"
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{currencyCode}: <span className="font-semibold text-foreground">€{formattedRate}</span></span>
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

export default CurrencyInfo; 