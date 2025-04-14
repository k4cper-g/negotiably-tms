import { useMediaQuery } from "./use-media-query";

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Returns `true` if the screen width is less than 768px.
 */
export function useIsMobile(): boolean {
  // Standard breakpoint for mobile (768px is common for tablets/mobile)
  return useMediaQuery("(max-width: 768px)");
} 