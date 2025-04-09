"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(true);
  
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
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden ml-64">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-center px-4 border-b bg-card">
        <span className="text-sm text-muted-foreground">Please keep in mind that this is a demo version of the platform and *most* features may not work as expected.</span>
          {/* <div className="flex items-center gap-4 justify-center">
          
            <UserButton afterSignOutUrl="/" />
          </div> */}
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
  );
} 