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
  MinusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
      <div className="fixed right-4 bottom-4 w-[400px] bg-white rounded-lg shadow-xl border z-50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Loading negotiation...</h3>
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
      <div className="fixed right-4 bottom-4 w-[260px] bg-white rounded-lg shadow-xl border z-50">
        <div 
          className="flex justify-between items-center p-3 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1">
              <Mail className="h-4 w-4 text-primary" />
              Negotiation {negotiationId.toString().substring(0, 6)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {negotiation.initialRequest.origin} → {negotiation.initialRequest.destination}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent expanding when clicking close
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Full view
  return (
    <div className="fixed right-4 bottom-4 w-[400px] max-h-[80vh] bg-white rounded-lg shadow-xl border z-50 flex flex-col">
      {/* Header - clickable to minimize */}
      <div 
        className="p-3 border-b flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(true)}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold flex items-center gap-1">
              <Mail className="h-4 w-4 text-primary" />
              Negotiation {negotiationId.toString().substring(0, 6)}
            </h3>
            <Badge 
              variant={
                negotiation.status === "pending" ? "outline" :
                negotiation.status === "accepted" ? "success" :
                negotiation.status === "rejected" ? "destructive" :
                "outline"
              }
              className="text-xs"
            >
              {negotiation.status === "pending" ? "Negotiating" : 
              negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {negotiation.initialRequest.origin} → {negotiation.initialRequest.destination}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent minimizing when clicking close
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Price summary */}
      <div className="flex justify-between border-b p-2 bg-muted/30 text-xs">
        <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3" />
          <span>Initial: {initialPrice}</span>
          <ArrowRight className="h-3 w-3" />
          <span>Current: {currentPrice}</span>
        </div>
        {savings > 0 && (
          <div className="text-green-600">
            Saved: €{savings.toFixed(0)} ({savingsPercentage.toFixed(1)}%)
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Initial negotiation message */}
        <div className="bg-muted/30 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">Negotiation Started</div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(negotiation.createdAt), "PPp")}
            </div>
          </div>
          <p>
            Transport negotiation initiated for route: {negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}.
            <br />Initial price: {negotiation.initialRequest.price}
          </p>
          {negotiation.initialRequest.notes && (
            <div className="mt-1">
              <strong>Additional Notes:</strong>
              <p>{negotiation.initialRequest.notes}</p>
            </div>
          )}
        </div>
        
        {/* Counter offers shown as emails */}
        {negotiation.counterOffers.map((offer, index) => (
          <div 
            key={`offer-${index}`}
            className={cn(
              "rounded-lg p-3 text-xs",
              offer.proposedBy === "user" 
                ? "bg-blue-50 border-blue-100" 
                : "bg-amber-50 border-amber-100"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">
                {offer.proposedBy === "user" ? "Your Proposal" : "Carrier Proposal"}
                <Badge 
                  variant={
                    offer.status === "pending" ? "outline" :
                    offer.status === "accepted" ? "success" :
                    "destructive"
                  }
                  className="ml-1 text-[10px] px-1 py-0"
                >
                  {offer.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(offer.timestamp), "PPp")}
              </div>
            </div>
            <div>
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
              "rounded-lg p-3 text-xs",
              msg.sender === "user"
                ? "bg-blue-50 border-blue-100"
                : "bg-amber-50 border-amber-100"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">
                {msg.sender === "user" ? "You" : "Carrier"}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(msg.timestamp), "PPp")}
              </div>
            </div>
            <p>{msg.content}</p>
          </div>
        ))}
        
        {/* Scrolling anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Actions */}
      <div className="flex justify-between p-2 border-t bg-muted/10">
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => handleUpdateStatus("rejected")}
            disabled={negotiation.status === "rejected" || negotiation.status === "accepted"}
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
          <Button 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => handleUpdateStatus("accepted")}
            disabled={negotiation.status === "accepted"}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            Accept
          </Button>
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-2 border-t">
        <div className="flex gap-1">
          <Textarea
            placeholder="Type your message here..."
            className="text-xs min-h-[60px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={negotiation.status !== "pending"}
          />
          <Button
            className="self-end h-8 w-8 p-0"
            variant="default"
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || negotiation.status !== "pending"}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 