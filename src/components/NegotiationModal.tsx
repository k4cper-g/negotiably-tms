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
  Bot,
  Info,
  User,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { Dialog } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NegotiationModalProps {
  negotiationId: Id<"negotiations"> | null;
  isOpen: boolean;
  onClose: () => void;
}

// Define helper functions locally
const parseNumericPrice = (price: string | number | undefined | null): number | null => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const numericString = price.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(numericString);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const formatPrice = (price: string | number | undefined | null): string => {
  const numericValue = parseNumericPrice(price);
  if (numericValue === null) return "-";
  return `€${numericValue.toFixed(2)}`; 
};

// Define available backgrounds (Mirror from settings page - TODO: Refactor to shared location)
const AVAILABLE_BACKGROUNDS = [
  { name: 'Default', value: 'default', className: 'bg-muted/40' },
  { name: 'Subtle Dots', value: 'dots', className: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-neutral-950 dark:bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] dark:[background-size:16px_16px]' },
  { name: 'Soft Gradient', value: 'gradient', className: 'bg-white bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)] dark:bg-neutral-950 dark:bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.1)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)]' },
];

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
  const [chatBackgroundValue] = useLocalStorage<string>('chatBackground', 'default'); // Read background pref
  
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
  const resumeAgent = useMutation(api.negotiations.resumeAgent);
  const configureAgent = useMutation(api.negotiations.configureAgent);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages, isMinimized]);
  
  // Find the background class based on the stored value
  const selectedBackground = AVAILABLE_BACKGROUNDS.find(bg => bg.value === chatBackgroundValue) || AVAILABLE_BACKGROUNDS[0]; 
  const chatBackgroundClass = selectedBackground.className;
  
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
  
  // Handle resuming agent
  const handleResumeAgent = async (action: "continue" | "take_over") => {
    if (!negotiation?._id) return;
    
    try {
      await resumeAgent({
        negotiationId: negotiation._id,
        action
      });
    } catch (error) {
      console.error("Error resuming agent:", error);
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
  
  // --- Combine and Filter Feed Data --- 
  const combinedFeed = [
    ...(negotiation.counterOffers || []),
    ...(negotiation.messages || [])
  ]
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  .filter(item => !('content' in item && item.sender === "system")); // Exclude system messages
  
  // Full view
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
        <div className={cn(
          "flex-1 overflow-y-auto p-3 space-y-3", 
          chatBackgroundClass // Apply dynamic background
        )}>
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Initial request info */}
            <div className="text-center text-xs text-muted-foreground my-2">
              <p className="inline-block bg-secondary text-secondary-foreground rounded-full px-2.5 py-1">
                Negotiation started on {format(negotiation.createdAt, "PP")} for{' '}
                <span className="font-medium">{negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}</span>
                {' '}at <span className="font-medium">{negotiation.initialRequest.price}</span>.
              </p>
              {negotiation.initialRequest.notes && (
                 <p className="mt-1.5 italic text-muted-foreground max-w-xs mx-auto text-xs">
                    Initial Notes: {negotiation.initialRequest.notes}
                 </p>
              )}
            </div>

            {/* Render the PRE-FILTERED combined feed */}
            {combinedFeed.map((item, index) => { 
               const isMessage = 'content' in item;
               const timestamp = new Date(item.timestamp);
               
               if (isMessage) {
                 // --- Message Rendering ---
                 const messageItem = item as typeof negotiation.messages[0];
                 const isUser = messageItem.sender === "user";
                 const isAgent = messageItem.sender === "agent";
                 const isSenderSideRight = isUser || isAgent;

                 let senderName = "";
                 if (isUser) {
                   senderName = "You";
                 } else if (isAgent) {
                   senderName = "AI Agent";
                 } else {
                   const emailMatch = messageItem.sender.match(/Email: (.*)/);
                   if (emailMatch && emailMatch[1]) {
                     const atIndex = emailMatch[1].indexOf('@');
                     senderName = atIndex > 0 ? emailMatch[1].substring(0, atIndex) : emailMatch[1];
                   } else {
                     senderName = messageItem.sender;
                   }
                 }

                 return (
                   <div
                     key={`msg-${index}`}
                     className={cn(
                       "flex flex-col mb-3",
                       isSenderSideRight ? "items-end" : "items-start"
                     )}
                   >
                     <span className={cn(
                       "text-xs mb-0.5 px-1 font-medium",
                       isUser ? "text-blue-600 dark:text-blue-400" : 
                       isAgent ? "text-emerald-600 dark:text-emerald-400" : 
                        "text-muted-foreground"
                     )}>
                       {isAgent && <Bot className="h-3 w-3 inline mr-0.5 mb-px" />}
                       {senderName}
                     </span>
                     <div
                       className={cn(
                         "flex gap-1.5", // Reduced gap slightly
                         isSenderSideRight ? "flex-row-reverse" : "flex-row"
                       )}
                     >
                       <div
                         className={cn(
                           "max-w-[80%] rounded-lg px-2.5 py-1.5 shadow-sm text-sm",
                           isUser
                             ? "bg-blue-500 text-white" 
                             : isAgent 
                               ? "bg-emerald-500 text-white" 
                               : "bg-card text-card-foreground border min-w-[180px]"
                         )}
                       >
                         <p className="whitespace-pre-wrap">{messageItem.content}</p>
                         <p className={cn(
                             "text-xs mt-0.5 opacity-80",
                             isUser || isAgent
                               ? "text-right" 
                               : "text-left",
                             isUser 
                               ? "text-blue-100" 
                               : isAgent
                                 ? "text-emerald-100" 
                                 : "text-muted-foreground"
                           )}
                           title={format(timestamp, "PPpp")}
                         >
                             {formatDistanceToNow(timestamp, { addSuffix: true })}
                         </p>
                       </div>
                     </div>
                   </div>
                 );
               } else {
                   // --- Offer Rendering ---
                  const offerItem = item as typeof negotiation.counterOffers[0];
                  // Check proposedBy for user/agent offers
                  const isUserOffer = offerItem.proposedBy === "user";
                  const isAgentOffer = offerItem.proposedBy === "agent";
                  const isSenderSideRight = isUserOffer || isAgentOffer;

                  let senderName = "";
                  if (isUserOffer) {
                    senderName = "Your Proposal";
                  } else if (isAgentOffer) {
                    senderName = "AI Agent Proposal";
                  } else {
                    senderName = "Client Offer"; // Renamed 
                  }

                  return (
                    <div 
                      key={`offer-${index}`}
                      className={cn(
                        "flex flex-col mb-3", 
                        isSenderSideRight ? "items-end" : "items-start"
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-0.5 px-1">
                        {senderName}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 shadow-sm border text-sm", 
                          isUserOffer 
                            ? "bg-blue-50 border-blue-200" 
                            : isAgentOffer
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-card border",
                          isSenderSideRight ? "max-w-[80%]" : "max-w-[90%]",
                          !isSenderSideRight && "min-w-[180px]" 
                        )}
                      >
                        <p className="font-medium text-foreground mb-0.5">{formatPrice(offerItem.price)}</p>
                        {offerItem.notes && <p className="text-xs text-muted-foreground italic">{offerItem.notes}</p>}
                        {offerItem.status !== 'pending' && (
                           <Badge
                              variant={ offerItem.status === "accepted" ? "default" : offerItem.status === "rejected" ? "destructive" : "outline" }
                              className="mt-1 text-xs px-1.5 py-0.5"
                           >
                              {offerItem.status.charAt(0).toUpperCase() + offerItem.status.slice(1)}
                           </Badge>
                        )}
                      </div>
                      <div 
                        className={cn(
                          "text-xs text-muted-foreground mt-0.5 px-1 opacity-80",
                          isSenderSideRight ? "text-right" : "text-left" 
                        )}
                        title={format(timestamp, "PPpp")}
                      >
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  );
                }
              })}
            
            {/* Agent Review UI */}
            {negotiation.isAgentActive && negotiation.agentState === "needs_review" && (
              <div className="mx-auto my-3 max-w-[90%] border rounded-lg bg-card overflow-hidden">
                <div className="p-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-muted rounded-full p-1.5 text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">AI Agent Needs Your Review</h3>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{negotiation.agentMessage || "The agent has paused and needs your decision on how to proceed."}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleResumeAgent("take_over")}
                      className="h-7 text-xs"
                    >
                      <User className="mr-1.5 h-3 w-3" />
                      Take Over
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleResumeAgent("continue")}
                      className="h-7 text-xs"
                    >
                      <Bot className="mr-1.5 h-3 w-3" />
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {negotiation.isAgentActive && negotiation.agentState === "error" && (
              <div className="mx-auto my-3 max-w-[90%] border rounded-lg bg-card overflow-hidden">
                <div className="p-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-muted rounded-full p-1.5 text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="font-medium text-sm text-foreground">AI Agent Error</h3>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{negotiation.agentMessage || "The agent encountered an error and couldn't continue."}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleResumeAgent("take_over")}
                      className="h-7 text-xs"
                    >
                      <User className="mr-1.5 h-3 w-3" />
                      Take Over
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onClose()}
                      className="h-7 text-xs"
                    >
                      <Settings2 className="mr-1.5 h-3 w-3" />
                      Configure Agent
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
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
    </Dialog>
  );
} 