"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowRight,
  DollarSign,
  MessageSquare,
  ThumbsUp,
  X,
  Send,
  Loader2,
  Mail,
  Pin,
  Clock,
  Calendar,
  Package,
  Ruler,
  Weight,
  ChevronUp,
  ChevronDown,
  Info,
  Check,
  ArrowRightLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { cn } from "@/lib/utils";

export default function NegotiationDetailClient({ 
  negotiationId 
}: { 
  negotiationId: Id<"negotiations">
}) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openNegotiation } = useNegotiationModal();
  
  // Fetch negotiation data
  const negotiation = useQuery(api.negotiations.getNegotiationById, { 
    negotiationId 
  });
  
  // Get mutations
  const addMessage = useMutation(api.negotiations.addMessage);
  const updateNegotiationStatus = useMutation(api.negotiations.updateNegotiationStatus);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages]);
  
  if (!negotiation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading negotiation details...</p>
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
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
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
    try {
      await updateNegotiationStatus({
        negotiationId,
        status,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with key info and actions */}
      <div className="border-b bg-white py-2 px-3 sm:px-4 sticky top-0 z-10 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 max-w-full mx-auto">
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {negotiation.initialRequest.origin} <ArrowRight className="inline-block h-4 w-4 mx-1" /> {negotiation.initialRequest.destination}
              </h1>
            <Badge 
              variant={
                negotiation.status === "pending" ? "secondary" :
                  negotiation.status === "accepted" ? "default" :
                negotiation.status === "rejected" ? "destructive" :
                "outline"
              }
                className="px-2 py-0.5"
            >
                {negotiation.status === "pending" ? "Active" : 
               negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
            </Badge>
          </div>
            <p className="text-xs text-muted-foreground truncate">
              Negotiation ID: {negotiationId.toString().substring(0, 12)}
          </p>
        </div>
          <div className="flex items-center gap-2 mt-1 md:mt-0 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
              className="gap-1 h-8"
            onClick={() => openNegotiation(negotiationId)}
            title="Open as floating chat"
          >
            <Pin className="h-4 w-4" />
              <span className="hidden sm:inline">Detach</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 gap-1 h-8"
            onClick={() => handleUpdateStatus("rejected")}
              disabled={negotiation.status !== "pending"}
          >
            <X className="h-4 w-4" />
              <span className="hidden sm:inline">Reject</span>
          </Button>
          <Button 
            size="sm" 
              className="gap-1 h-8"
            onClick={() => handleUpdateStatus("accepted")}
              disabled={negotiation.status !== "pending"}
          >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Accept</span>
          </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
          {/* Main chat section */}
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden order-2 md:order-1">
            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3">
              <div className="space-y-3 max-w-[900px] mx-auto">
                {/* Initial negotiation message */}
                <div className="bg-muted/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      Negotiation Started
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(negotiation.createdAt), "PPp")}
                    </div>
                  </div>
                  <p className="text-sm">
                    Transport negotiation initiated for route: {negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}.
                    <br />Initial price: <span className="font-medium">{negotiation.initialRequest.price}</span>
                  </p>
                  {negotiation.initialRequest.notes && (
                    <div className="mt-1 text-sm">
                      <strong>Additional Notes:</strong>
                      <p className="mt-1">{negotiation.initialRequest.notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Counter offers shown as emails */}
                {negotiation.counterOffers.map((offer, index) => (
                  <div 
                    key={`offer-${index}`}
                    className={cn(
                      "rounded-lg p-3 transition-all",
                      offer.proposedBy === "user" 
                        ? "bg-blue-50/80 border-l-4 border-blue-400" 
                        : "bg-amber-50/80 border-l-4 border-amber-400"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm flex items-center">
                        {offer.proposedBy === "user" ? "Your Proposal" : "Carrier Proposal"}
                        <Badge 
                          variant={
                            offer.status === "pending" ? "outline" :
                            offer.status === "accepted" ? "default" :
                            "destructive"
                          }
                          className="ml-2 text-xs"
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(offer.timestamp), "PPp")}
                      </div>
                    </div>
                    <div className="text-sm">
                      <p>Proposed price: <strong>{offer.price}</strong></p>
                      {offer.notes && <p className="mt-1">{offer.notes}</p>}
                    </div>
                  </div>
                ))}
                
                {/* Regular messages */}
                {negotiation.messages.map((msg, index) => (
                  <div
                    key={`msg-${index}`}
                    className={cn(
                      "rounded-lg p-3 transition-all",
                      msg.sender === "user"
                        ? "bg-blue-50/80 border-l-4 border-blue-400"
                        : "bg-amber-50/80 border-l-4 border-amber-400"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">
                        {msg.sender === "user" ? "You" : "Carrier"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(msg.timestamp), "PPp")}
                      </div>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
                
                {/* Scrolling anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message input */}
            <div className="p-2 sm:p-3 border-t bg-white flex-shrink-0">
              <div className="max-w-[900px] mx-auto">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your message here..."
                    className="flex-1 min-h-[50px] sm:min-h-[60px] resize-none bg-white"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={negotiation.status !== "pending"}
                />
                <Button
                    className="h-[50px] sm:h-[60px] px-2 sm:px-3"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending || negotiation.status !== "pending"}
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {negotiation.status !== "pending" && (
                  <p className="text-xs text-muted-foreground mt-1">
                  This negotiation is {negotiation.status}. You cannot send new messages.
                </p>
              )}
            </div>
            </div>
          </div>
          
          {/* Side details panel - collapsible on mobile */}
          <div className={`border-l border-t md:border-t-0 bg-white md:w-[250px] lg:w-[280px] overflow-hidden order-1 md:order-2 transition-all ${detailsExpanded ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
            <div className="flex items-center justify-between p-2 border-b bg-muted/20 md:bg-transparent flex-shrink-0">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span>Negotiation Details</span>
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto md:hidden"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
              >
                {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-2 sm:p-3 space-y-3">
                {/* Price summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Price Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/20 p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">Initial</div>
                      <div className="font-medium text-sm">{initialPrice}</div>
                    </div>
                    
                    <div className="bg-muted/20 p-2 rounded-md">
                      <div className="text-xs text-muted-foreground">Current</div>
                      <div className="font-medium text-sm">{currentPrice}</div>
                    </div>
                  </div>
                  
                  {savings > 0 && (
                    <div className="bg-green-50 border border-green-100 p-2 rounded-md">
                      <div className="text-xs text-green-700">Savings</div>
                      <div className="font-medium text-sm text-green-800 flex items-center gap-1">
                        €{savings.toFixed(0)}
                        <span className="text-xs text-green-600">({savingsPercentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Transport details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Transport Details
                  </h4>
                  <div className="divide-y">
                    {negotiation.initialRequest.loadType && (
                      <div className="flex items-center gap-2 py-1.5">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">{negotiation.initialRequest.loadType}</div>
                      </div>
                    )}
                    
                    {negotiation.initialRequest.weight && (
                      <div className="flex items-center gap-2 py-1.5">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">{negotiation.initialRequest.weight}</div>
                      </div>
                    )}
                    
                    {negotiation.initialRequest.dimensions && (
                      <div className="flex items-center gap-2 py-1.5">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">{negotiation.initialRequest.dimensions}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Negotiation meta */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Timeline
                  </h4>
                  <div className="bg-muted/10 rounded-md p-2 text-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">Created <span className="font-medium text-foreground">{formatDistanceToNow(new Date(negotiation.createdAt), { addSuffix: true })}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">Last update <span className="font-medium text-foreground">{formatDistanceToNow(new Date(negotiation.updatedAt), { addSuffix: true })}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{negotiation.messages.length}</span> messages,
                        <span className="font-medium text-foreground ml-1">{negotiation.counterOffers.length}</span> offers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 