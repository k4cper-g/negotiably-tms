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
  Pin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../../../convex/_generated/dataModel";
import { useNegotiationModal } from "@/context/NegotiationModalContext";

export default function NegotiationDetailClient({ 
  negotiationId 
}: { 
  negotiationId: Id<"negotiations">
}) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
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
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Negotiation {negotiationId.toString().substring(0, 8)}</h1>
            <Badge variant="outline" className="gap-1">
              {negotiation.offerId}
            </Badge>
            <Badge 
              variant={
                negotiation.status === "pending" ? "outline" :
                negotiation.status === "accepted" ? "success" :
                negotiation.status === "rejected" ? "destructive" :
                "outline"
              }
            >
              {negotiation.status === "pending" ? "Negotiating" : 
               negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Transport negotiation between {negotiation.initialRequest.origin} and {negotiation.initialRequest.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => openNegotiation(negotiationId)}
            title="Open as floating chat"
          >
            <Pin className="h-4 w-4" />
            <span>Detach</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => handleUpdateStatus("rejected")}
            disabled={negotiation.status === "rejected" || negotiation.status === "accepted"}
          >
            <X className="h-4 w-4" />
            <span>Reject</span>
          </Button>
          <Button 
            size="sm" 
            className="gap-1"
            onClick={() => handleUpdateStatus("accepted")}
            disabled={negotiation.status === "accepted"}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>Accept Offer</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Side panel with details - moved to left side */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Initial Price</div>
                <div className="font-medium">{initialPrice}</div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Current Price</div>
                <div className="font-medium">{currentPrice}</div>
              </div>
              
              {savings > 0 && (
                <div>
                  <div className="text-muted-foreground">Savings</div>
                  <div className="font-medium text-green-600">
                    €{savings.toFixed(0)} ({savingsPercentage.toFixed(1)}%)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Negotiation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Route</div>
                <div className="font-medium">{negotiation.initialRequest.origin} → {negotiation.initialRequest.destination}</div>
              </div>
              
              {negotiation.initialRequest.loadType && (
                <div>
                  <div className="text-muted-foreground">Load Type</div>
                  <div className="font-medium">{negotiation.initialRequest.loadType}</div>
                </div>
              )}
              
              {negotiation.initialRequest.weight && (
                <div>
                  <div className="text-muted-foreground">Weight</div>
                  <div className="font-medium">{negotiation.initialRequest.weight}</div>
                </div>
              )}
              
              {negotiation.initialRequest.dimensions && (
                <div>
                  <div className="text-muted-foreground">Dimensions</div>
                  <div className="font-medium">{negotiation.initialRequest.dimensions}</div>
                </div>
              )}
              
              <div>
                <div className="text-muted-foreground">Activity</div>
                <div>Created: {formatDistanceToNow(new Date(negotiation.createdAt), { addSuffix: true })}</div>
                <div>Last updated: {formatDistanceToNow(new Date(negotiation.updatedAt), { addSuffix: true })}</div>
                <div>Messages: {negotiation.messages.length}</div>
                <div>Offers: {negotiation.counterOffers.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main email-like chat panel - takes up more space */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-12rem)]">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="space-y-4 p-4">
                {/* Initial negotiation message */}
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Negotiation Started</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(negotiation.createdAt), "PPp")}
                    </div>
                  </div>
                  <p className="text-sm">
                    Transport negotiation initiated for route: {negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}.
                    <br />Initial price: {negotiation.initialRequest.price}
                  </p>
                  {negotiation.initialRequest.notes && (
                    <div className="mt-2 text-sm">
                      <strong>Additional Notes:</strong>
                      <p className="mt-1">{negotiation.initialRequest.notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Counter offers shown as emails */}
                {negotiation.counterOffers.map((offer, index) => (
                  <div 
                    key={`offer-${index}`}
                    className={`rounded-lg p-4 border ${
                      offer.proposedBy === "user" 
                        ? "bg-blue-50 border-blue-100" 
                        : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {offer.proposedBy === "user" ? "Your Proposal" : "Carrier Proposal"}
                        <Badge 
                          variant={
                            offer.status === "pending" ? "outline" :
                            offer.status === "accepted" ? "success" :
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
                    className={`rounded-lg p-4 border ${
                      msg.sender === "user"
                        ? "bg-blue-50 border-blue-100"
                        : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
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
            </CardContent>
            
            {/* Message input */}
            <div className="p-4 border-t mt-auto">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type your message here..."
                  className="flex-1 min-h-[80px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={negotiation.status !== "pending"}
                />
                <Button
                  className="h-[80px] px-4"
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
                <p className="text-xs text-muted-foreground mt-2">
                  This negotiation is {negotiation.status}. You cannot send new messages.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 