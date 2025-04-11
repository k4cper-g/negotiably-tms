// src/components/providers/FontProviderBody.tsx
"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";

interface FontProviderBodyProps {
  children: React.ReactNode;
  fontVariables: string; // CSS variable declarations from next/font
}

// Map font setting values to Tailwind classes
const fontClassMap: Record<string, string> = {
  system: "", // No specific class for system default
  inter: "font-inter",
  manrope: "font-manrope",
};

export const FontProviderBody = ({ children, fontVariables }: FontProviderBodyProps) => {
  const [appFont] = useLocalStorage<string>("appFont", "system"); // Read preference

  const fontClass = fontClassMap[appFont] || ""; // Get class or empty string

  return (
    <body className={cn(
      "min-h-screen bg-background font-sans antialiased", // Base styles
      fontVariables, // Apply the CSS font variables
      fontClass      // Apply the selected font utility class
    )}>
      {children}
    </body>
  );
}
