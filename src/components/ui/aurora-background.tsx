"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={cn("relative w-full", className)} {...props}>
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 [background-image:linear-gradient(to_right,var(--blue-500),var(--indigo-300),var(--blue-300),var(--violet-200),var(--blue-400))] dark:[background-image:linear-gradient(to_right,var(--blue-600),var(--indigo-400),var(--blue-400),var(--violet-300),var(--blue-500))] [background-size:300%] opacity-50 blur-[100px]" 
          style={{
            animation: "aurora 60s linear infinite"
          }}
        />
      </div>
      {children}
    </div>
  );
};
