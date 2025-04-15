"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Loader2, AlertTriangle, Truck, FileText, CloudSun, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import WeatherInfo from "@/components/WeatherInfo";
import CurrencyInfo from "@/components/CurrencyInfo";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import TopBarSettingsDialog from "@/components/TopBarSettingsDialog";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(true);
  
  // Fetch user preferences
  const preferences = useQuery(api.users.getMyPreferences);

  // Handle initial render
  useEffect(() => {
    setIsMounted(true);
    
    // Simulate content loading
    const timer = setTimeout(() => {
      setIsContentLoading(false);
    }, 500); // Short delay to prevent flash
    
    return () => clearTimeout(timer);
  }, []);
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Dialog>
        <div className="relative flex h-screen overflow-hidden bg-background">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex flex-col flex-1 overflow-hidden ml-64">
            {/* Top Navigation - Market Info Mockup (Pill Style) */}
            <header className="h-16 flex items-center justify-between px-6 border-b bg-card shrink-0">
              {/* Left side placeholder */}
              <div></div>

              {/* Center: Market/Global Info (Pills) + Add Button */}
              {/* Check preferences is not undefined before accessing properties */}
              {preferences === undefined ? (
                <div className="flex items-center gap-3">
                  {/* Loading placeholders */}
                  <div className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
                </div>
              ) : preferences && ( // Add check here to ensure preferences object exists
                <div className="flex items-center gap-3 text-sm relative group">
                  {/* Pass fetched preferences as props */}
                  <CurrencyInfo currencies={preferences.currencies} />
                  <WeatherInfo cities={preferences.cities} />
                  
                  {/* No Widgets Indicator */}
                  {(!preferences.currencies?.length && !preferences.cities?.length) && (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-full px-3 py-1 h-8">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No widgets selected</span>
                    </div>
                  )}
                  
                  {/* Add Button Trigger for Settings Dialog */}
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-8 h-8 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add or remove items</span>
                    </Button>
                  </DialogTrigger>
                </div>
              )}

              {/* Right: User Menu Placeholder */}
              <div className="flex items-center gap-4">
       
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto relative bg-card">
              <div 
                className={cn(
                  "absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-300",
                  isContentLoading ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <div className="flex flex-col items-center gap-3 bg-card/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading page...</p>
                </div>
              </div>
              {children}
            </main>
          </div>
        </div>
        
        {/* Render the Dialog Content (controlled by the trigger) */}
        <TopBarSettingsDialog />
      </Dialog>
    </ThemeProvider>
  );
} 