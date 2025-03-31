"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "@/components/layout/Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Load sidebar state from localStorage on initial mount
  useEffect(() => {
    setIsMounted(true);
    
    // If on mobile, default to collapsed
    if (isMobile) {
      setIsCollapsed(true);
      return;
    }
    
    // Get saved state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    
    // Only set if we have a saved value
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, [isMobile]);
  
  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMounted]);
  
  // Memoize content margin style to prevent unnecessary re-renders
  const contentStyle = useMemo(() => ({
    marginLeft: isCollapsed ? "70px" : "250px"
  }), [isCollapsed]);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} />

      {/* Main Content */}
      <div 
        className="flex flex-col flex-1 overflow-hidden transition-margin duration-300 ease-in-out"
        style={contentStyle}
      >
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex md:flex text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
          
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
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