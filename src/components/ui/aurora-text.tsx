"use client";

import { cn } from "@/lib/utils";
import { motion, MotionProps } from "framer-motion";
import React, { useRef, useId, useEffect, useState } from "react";

interface AuroraTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  delayAurora?: number;
  showAurora?: boolean;
}

// Wrap the component with React.memo to prevent unnecessary re-renders
export const AuroraText = React.memo(function AuroraTextInner({
  className,
  children,
  as: Component = "span",
  delayAurora = 0,
  showAurora = true,
  ...props
}: AuroraTextProps) {
  // Use a stable ID to maintain animation state across renders
  const uniqueId = useRef(useId()).current;
  const MotionComponent = motion.create(Component);
  const [showEffect, setShowEffect] = useState(showAurora && delayAurora === 0);

  // Handle delayed showing of aurora effect
  useEffect(() => {
    if (delayAurora > 0 && showAurora) {
      const timer = setTimeout(() => {
        setShowEffect(true);
      }, delayAurora * 1000); // Convert to milliseconds
      
      return () => clearTimeout(timer);
    } else {
      setShowEffect(showAurora);
    }
  }, [delayAurora, showAurora]);

  return (
    <MotionComponent
      data-aurora-id={uniqueId}
      className={cn("relative inline-flex overflow-hidden", className)}
      {...props}
    >
      {children}
      {showEffect && (
      <span className="pointer-events-none absolute inset-0 mix-blend-lighten dark:mix-blend-darken">
     <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="pointer-events-none absolute -top-1/2 h-[30vw] w-[30vw] animate-[aurora-border_6s_ease-in-out_infinite,aurora-1_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-1))] mix-blend-overlay blur-[1rem]"
        ></motion.span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="pointer-events-none absolute right-0 top-0 h-[30vw] w-[30vw] animate-[aurora-border_6s_ease-in-out_infinite,aurora-2_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-2))] mix-blend-overlay blur-[1rem]"
        ></motion.span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="pointer-events-none absolute bottom-0 left-0 h-[30vw] w-[30vw] animate-[aurora-border_6s_ease-in-out_infinite,aurora-3_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-3))] mix-blend-overlay blur-[1rem]"
        ></motion.span>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="pointer-events-none absolute -bottom-1/2 right-0 h-[30vw] w-[30vw] animate-[aurora-border_6s_ease-in-out_infinite,aurora-4_12s_ease-in-out_infinite_alternate] bg-[hsl(var(--color-4))] mix-blend-overlay blur-[1rem]"
        ></motion.span>
      </span>
      )}
    </MotionComponent>
  );
});
