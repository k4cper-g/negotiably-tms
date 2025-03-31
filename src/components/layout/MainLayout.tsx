"use client";

import { ReactNode, useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle initial render
  useEffect(() => {
    setIsMounted(true);
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
        <header className="h-16 flex items-center justify-end px-4 border-b bg-card">
          <div className="flex items-center gap-4">
            {/* <UserButton afterSignOutUrl="/" /> */}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 