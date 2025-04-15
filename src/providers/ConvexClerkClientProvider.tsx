"use client";

import { useAuth } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useState, useEffect } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Wrapper component to handle auth loading state
function AuthWrapper({ children }: { children: ReactNode }) {
  const clerk = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Wait for both client-side mounting and Clerk to be loaded
  if (!mounted || !clerk.isLoaded) {
    return null; // Or a loading spinner if preferred
  }
  
  return <>{children}</>;
}

export function ConvexClerkClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}