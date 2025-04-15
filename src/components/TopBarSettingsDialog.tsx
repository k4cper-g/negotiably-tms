'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

// --- Configuration: Available options --- 
// In a real app, these might come from a config file or API
const AVAILABLE_CITIES = ['London', 'Berlin', 'Warsaw', 'New York', 'Tokyo', 'Paris', 'Sydney'];
const AVAILABLE_CURRENCIES = ['USD', 'GBP', 'PLN', 'JPY', 'CAD', 'AUD', 'CHF'];
const MAX_SELECTIONS = 5; // Limit how many items can be selected per category

// --- Component Props --- 
// This component doesn't need external props for now, 
// it controls its own open state via DialogTrigger in the layout

const TopBarSettingsDialog: React.FC = () => {
  // Fetch current preferences
  const currentPreferences = useQuery(api.users.getMyPreferences);
  const updatePreferences = useMutation(api.users.updateMyPreferences);

  // Local state for selections within the dialog
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Effect to initialize local state when preferences load
  useEffect(() => {
    if (currentPreferences) {
      setSelectedCities(currentPreferences.cities || []);
      setSelectedCurrencies(currentPreferences.currencies || []);
    }
  }, [currentPreferences]);

  // Handlers for checkbox changes
  const handleCityChange = (city: string, checked: boolean | 'indeterminate') => {
    setSelectedCities(prev => {
      const current = new Set(prev);
      if (checked === true) {
        current.add(city);
      } else {
        current.delete(city);
      }
      // Enforce max selections
      return Array.from(current).slice(0, MAX_SELECTIONS); 
    });
  };

  const handleCurrencyChange = (currency: string, checked: boolean | 'indeterminate') => {
    setSelectedCurrencies(prev => {
      const current = new Set(prev);
      if (checked === true) {
        current.add(currency);
      } else {
        current.delete(currency);
      }
      // Enforce max selections
      return Array.from(current).slice(0, MAX_SELECTIONS);
    });
  };

  // Handler for saving changes
  const handleSave = () => {
    // Close the dialog immediately
    document.getElementById('close-settings-dialog')?.click();
    
    // Save in the background without loading state
    updatePreferences({ 
      cities: selectedCities, 
      currencies: selectedCurrencies 
    }).then(() => {
      toast.success('Top bar preferences saved!');
    }).catch((error) => {
      console.error("Failed to save preferences:", error);
      toast.error('Failed to save preferences. Please try again.');
    });
  };

  // Loading state for initial preferences
  if (currentPreferences === undefined) {
    return (
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Top Bar</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DialogContent>
    );
  }

  // Render the dialog content
  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Customize Top Bar</DialogTitle>
        <DialogDescription>
          Select up to {MAX_SELECTIONS} cities and currencies to display. Changes will apply on next refresh.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-6 py-4">
        {/* Cities Selection */}
        <div>
          <h4 className="font-semibold mb-3">Cities (Weather)</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2"> {/* Scrollable */} 
            {AVAILABLE_CITIES.map((city) => (
              <div key={city} className="flex items-center space-x-2">
                <Checkbox 
                  id={`city-${city}`}
                  checked={selectedCities.includes(city)}
                  onCheckedChange={(checked) => handleCityChange(city, checked)}
                  disabled={selectedCities.length >= MAX_SELECTIONS && !selectedCities.includes(city)}
                />
                <Label htmlFor={`city-${city}`}>{city}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Currencies Selection */}
        <div>
          <h4 className="font-semibold mb-3">Currencies (EUR Base)</h4>
           <div className="space-y-2 max-h-60 overflow-y-auto pr-2"> {/* Scrollable */} 
            {AVAILABLE_CURRENCIES.map((currency) => (
              <div key={currency} className="flex items-center space-x-2">
                <Checkbox 
                  id={`currency-${currency}`}
                  checked={selectedCurrencies.includes(currency)}
                  onCheckedChange={(checked) => handleCurrencyChange(currency, checked)}
                  disabled={selectedCurrencies.length >= MAX_SELECTIONS && !selectedCurrencies.includes(currency)}
                />
                <Label htmlFor={`currency-${currency}`}>{currency}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button id="close-settings-dialog" type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="button" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default TopBarSettingsDialog; 