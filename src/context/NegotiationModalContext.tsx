"use client";

import React, { createContext, useContext, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { NegotiationModal } from "@/components/NegotiationModal";

interface NegotiationModalContextType {
  openNegotiation: (negotiationIdOrObject: Id<"negotiations"> | { negotiationId: Id<"negotiations"> }) => void;
  closeNegotiation: () => void;
}

const NegotiationModalContext = createContext<NegotiationModalContextType>({
  openNegotiation: () => {},
  closeNegotiation: () => {},
});

export function useNegotiationModal() {
  return useContext(NegotiationModalContext);
}

export function NegotiationModalProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [negotiationId, setNegotiationId] = useState<Id<"negotiations"> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openNegotiation = (negotiationIdOrObject: Id<"negotiations"> | { negotiationId: Id<"negotiations"> }) => {
    // Check if the parameter is an object with negotiationId property
    if (typeof negotiationIdOrObject === 'object' && 'negotiationId' in negotiationIdOrObject) {
      setNegotiationId(negotiationIdOrObject.negotiationId);
    } else {
      // It's already an ID
      setNegotiationId(negotiationIdOrObject as Id<"negotiations">);
    }
    setIsOpen(true);
  };

  const closeNegotiation = () => {
    setIsOpen(false);
    // Keep the ID for a smooth exit animation, clear it after closing
    setTimeout(() => {
      setNegotiationId(null);
    }, 300);
  };

  return (
    <NegotiationModalContext.Provider value={{ openNegotiation, closeNegotiation }}>
      {children}
      <NegotiationModal
        negotiationId={negotiationId}
        isOpen={isOpen}
        onClose={closeNegotiation}
      />
    </NegotiationModalContext.Provider>
  );
} 