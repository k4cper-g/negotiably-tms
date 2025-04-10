"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  DollarSign,
  MessageSquare,
  ThumbsUp,
  X,
  Send,
  Loader2,
  Mail,
  MinusCircle,
  Check,
  ArrowRightLeft,
  Bot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

interface NegotiationModalProps {
  negotiationId: Id<"negotiations"> | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NegotiationModal({ 
  negotiationId,
  isOpen,
  onClose
}: NegotiationModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  
  // Reset state when negotiation changes
  useEffect(() => {
    setMessage("");
  }, [negotiationId]);
  
  // Fetch negotiation data
  const negotiation = useQuery(
    api.negotiations.getNegotiationById, 
    negotiationId ? { negotiationId } : "skip"
  );
  
  // Get mutations
  const addMessage = useMutation(api.negotiations.addMessage);
  const updateNegotiationStatus = useMutation(api.negotiations.updateNegotiationStatus);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages, isMinimized]);
  
  if (!isOpen || !negotiationId) return null;
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !negotiationId) return;
    
    setIsSending(true);
    try {
      await addMessage({
        negotiationId,
        message: message.trim(),
        sender: "user", // This is the current user
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle accepting or rejecting an offer
  const handleUpdateStatus = async (status: string) => {
    if (!negotiationId) return;
    
    try {
      await updateNegotiationStatus({
        negotiationId,
        status,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  
  if (!negotiation) {
    return (
      <div className="fixed right-4 bottom-4 w-[400px] bg-card rounded-lg shadow-xl border z-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-foreground">Loading negotiation...</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading negotiation details...</p>
        </div>
      </div>
    );
  }

  // Calculate savings
  const getNumericPrice = (price: string) => {
    return parseFloat(price.replace(/[^0-9.]/g, ""));
  };
  
  const initialPrice = negotiation.initialRequest.price;
  const latestOffer = negotiation.counterOffers.length > 0
    ? negotiation.counterOffers[negotiation.counterOffers.length - 1]
    : null;
  const currentPrice = latestOffer ? latestOffer.price : initialPrice;
  
  // Calculate savings
  const initialNumeric = getNumericPrice(initialPrice);
  const currentNumeric = getNumericPrice(currentPrice);
  let savings = 0;
  let savingsPercentage = 0;
  
  if (initialNumeric > currentNumeric) {
    savings = initialNumeric - currentNumeric;
    savingsPercentage = (savings / initialNumeric) * 100;
  }
  
  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed right-6 bottom-4 w-[280px] bg-card rounded-lg shadow-lg border z-50 cursor-pointer hover:shadow-xl transition-shadow">
        <div 
          className="flex justify-between items-center p-2"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground">
                Negotiation
              </h3>
              <p className="text-xs text-muted-foreground truncate" title={`${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`}>
                {negotiation.initialRequest.origin} → {negotiation.initialRequest.destination}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Full view
  return (
    <div className="fixed right-6 bottom-4 w-[400px] max-w-[calc(100vw-48px)] max-h-[650px] bg-card rounded-lg shadow-xl border z-50 flex flex-col overflow-hidden">
      {/* Header - Make clickable for minimize */}
      <div 
        className="p-3 border-b bg-card flex items-center justify-between flex-shrink-0 cursor-pointer"
        onClick={() => setIsMinimized(true)}
        title="Minimize Chat"
      >
        {/* Left: Title, Status */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Title & Status */}
          <div className="flex flex-col min-w-0">
            <h3 
              className="font-semibold text-sm truncate flex items-center text-foreground" 
              title={`${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`}
            >
              {negotiation.initialRequest.origin}
              <ArrowRight className="h-3.5 w-3.5 mx-1 text-muted-foreground flex-shrink-0" />
              {negotiation.initialRequest.destination}
            </h3>
            <p className="text-xs text-muted-foreground truncate" title={`Negotiation ID: ${negotiationId}`}> 
              ID: {negotiationId.toString().substring(0, 8)}...
            </p>
          </div>
          <Badge 
            variant={
              negotiation.status === "pending" ? "secondary" :
              negotiation.status === "accepted" ? "success" :
              negotiation.status === "rejected" ? "destructive" :
              "outline"
            }
            className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-1"
          >
            {negotiation.status === "pending" ? "Active" : 
            negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
          </Badge>
        </div>

        {/* Right: Actions (Close Only) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Close button - Keep stopPropagation */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-foreground" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Price summary - REMOVED */}
      {/* <div className="flex justify-between border-b p-2 bg-muted/30 text-xs"> ... </div> */}
      
      {/* Messages - Apply new chat feed style */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/40">
        {/* Combined Messages and Offers Feed */}
        {[
          // Add a fake initial message object for rendering the system message
          { type: 'system', timestamp: negotiation.createdAt }, 
          ...(negotiation.counterOffers || []),
          ...(negotiation.messages || [])
        ]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Ensure chronological order
        .map((item, index) => {
          const timestamp = new Date(item.timestamp);

          // --- System Message Rendering ---
          if ('type' in item && item.type === 'system') {
             return (
               <div key={`sys-${index}`} className="text-center text-xs text-muted-foreground my-3">
                 <p className="inline-block bg-secondary text-secondary-foreground rounded-full px-2.5 py-1">
                   Negotiation started on {format(timestamp, "PP")} for{' '}
                   <span className="font-medium">{negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}</span>
                   {' '}at <span className="font-medium">{negotiation.initialRequest.price}</span>.
                 </p>
                 {negotiation.initialRequest.notes && (
                    <p className="mt-1.5 italic text-muted-foreground max-w-xs mx-auto text-xs">
                       Initial Notes: {negotiation.initialRequest.notes}
                    </p>
                 )}
               </div>
             );
          }

          // Determine if the item is a message or an offer
          const isMessage = 'content' in item; 

          if (isMessage) {
            // --- Message Rendering ---
            const messageItem = item as typeof negotiation.messages[0];
            const isUser = messageItem.sender === "user";
            // Check for agent message - Adjust "agent" if your sender ID is different
            const isAgent = messageItem.sender === "agent"; 
            // Determine right alignment for user OR agent
            const isSenderSideRight = isUser || isAgent;

            return (
              <div
                key={`msg-${index}`}
                // Update alignment logic
                className={cn("flex", isSenderSideRight ? "justify-end" : "justify-start")}
              >
                {/* Optional: Add Avatar based on sender */}
                {/* {!isSenderSideRight && <Avatar>...</Avatar>} */}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-2.5 py-1.5 shadow-sm text-sm",
                    isUser
                      ? "bg-blue-500 text-white" // Fixed blue for User
                      : isAgent 
                        ? "bg-emerald-500 text-white" // Fixed green for Agent
                        : "bg-card text-card-foreground border" // Adaptive for Carrier/Other
                  )}
                >
                  <p className="whitespace-pre-wrap">{messageItem.content}</p>
                  <p className={cn(
                      "text-xs mt-0.5 text-right opacity-80",
                      isUser 
                        ? "text-blue-100" // Lighter blue for user timestamp
                        : isAgent
                          ? "text-emerald-100" // Lighter green for agent timestamp
                          : "text-muted-foreground" // Adaptive for others
                    )}
                    title={format(timestamp, "PPpp")}
                  >
                      {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </p>
                </div>
                {/* Optional: Add Avatar based on sender */}
                {/* {isSenderSideRight && isUser && <Avatar>...</Avatar> } */}
                {/* {isSenderSideRight && isAgent && <Avatar><Bot.../></Avatar>} */}
              </div>
            );
          } else {
              // --- Counter Offer Rendering ---
             const offerItem = item as typeof negotiation.counterOffers[0];
             const isUserProposal = offerItem.proposedBy === "user";

             return (
               <div key={`offer-${index}`} className="text-center text-xs text-muted-foreground my-3">
                  <div className={cn(
                    "inline-block border rounded-lg px-3 py-1.5 text-left max-w-xs mx-auto shadow-sm",
                     isUserProposal 
                       ? "border-blue-200 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700" 
                       : "border-amber-200 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700"
                  )}>
                   <div className="flex justify-between items-center mb-0.5">
                      <span className={cn(
                          "font-semibold text-sm",
                          isUserProposal ? "text-blue-700 dark:text-blue-300" : "text-amber-800 dark:text-amber-300"
                        )}>
                         {isUserProposal ? "Your Proposal" : "Carrier Proposal"}
                      </span>
                      <span className="text-xs text-muted-foreground" title={format(timestamp, "PPpp")}>
                         {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </span>
                   </div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{offerItem.price}</p>
                    {offerItem.notes && <p className="text-xs text-muted-foreground italic mt-1">{offerItem.notes}</p>}
                    {offerItem.status !== 'pending' && (
                      <Badge
                         variant={
                           offerItem.status === "accepted" ? "success" :
                           offerItem.status === "rejected" ? "destructive" :
                           "outline"
                         }
                         className="mt-1.5 text-xs px-1.5 py-0.5"
                       >
                         {offerItem.status.charAt(0).toUpperCase() + offerItem.status.slice(1)}
                       </Badge>
                    )}
                  </div>
                </div>
             );
           }
         })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Apply final styling */}
      <div className="border-t bg-card p-2 flex-shrink-0"> {/* Consistent background */}
        <div className="flex items-start space-x-2"> {/* Consistent spacing */}
          <Textarea
            placeholder="Type message..." // Keep placeholder simple
            className="flex-1 min-h-[38px] max-h-[100px] resize-none bg-card border rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-sm p-2 disabled:bg-muted" // Added rounded-lg, adjusted padding
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending || negotiation.status !== "pending"} // Removed !message.trim()
            onKeyDown={(e) => { // Added Enter to send
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            title={negotiation.status !== "pending" ? "Negotiation closed" : "Shift+Enter for newline"} // Dynamic title
          />
          <Button 
            size="icon" // Use icon size
            onClick={handleSendMessage}
            disabled={isSending || !message.trim() || negotiation.status !== "pending"} // Re-added !message.trim()
            className="h-9 w-9 flex-shrink-0 rounded-lg" // Use rounded-lg, adjusted size
            title="Send Message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" /> // Adjusted icon size
            ) : (
              <Send className="h-4 w-4" /> // Adjusted icon size
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 