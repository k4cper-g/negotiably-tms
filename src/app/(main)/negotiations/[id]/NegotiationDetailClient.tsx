"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  DollarSign,
  X,
  Send,
  Loader2,
  Pin,
  Clock,
  Package,
  Ruler,
  Weight,
  ChevronUp,
  ChevronDown,
  Info,
  Check
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
    <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height))] overflow-hidden bg-gray-50">
      {/* Header with key info and actions */}
      <div className="border-b bg-white py-3 px-4 sm:px-6 sticky top-0 z-10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-full mx-auto">
          {/* Left side: Title and Status */}
          <div className="flex items-center gap-x-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate flex items-center" title={`${negotiation.initialRequest.origin} to ${negotiation.initialRequest.destination}`}>
                {negotiation.initialRequest.origin}
                <ArrowRight className="inline-block h-4 w-4 mx-1.5 text-muted-foreground flex-shrink-0" />
                {negotiation.initialRequest.destination}
              </h1>
              <p className="text-xs text-muted-foreground truncate" title={`Negotiation ID: ${negotiationId}`}>
                ID: {negotiationId.toString().substring(0, 12)}...
              </p>
            </div>
            <Badge
              variant={
                negotiation.status === "pending" ? "secondary" :
                  negotiation.status === "accepted" ? "default" :
                negotiation.status === "rejected" ? "destructive" :
                "outline"
              }
              className="px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0"
            >
              {negotiation.status === "pending" ? "Active" :
               negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
            </Badge>
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => openNegotiation(negotiationId)}
              title="Open as floating chat"
            >
              <Pin className="h-4 w-4" />
              <span className="hidden sm:inline">Detach</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive gap-1 h-8"
              onClick={() => handleUpdateStatus("rejected")}
              disabled={negotiation.status !== "pending"}
              title="Reject Offer"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Reject</span>
            </Button>
            <Button
              size="sm"
              className="gap-1 h-8"
              onClick={() => handleUpdateStatus("accepted")}
              disabled={negotiation.status !== "pending"}
              title="Accept Offer"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="max-w-[900px] mx-auto space-y-4">
                {/* Initial negotiation message - System Message Style */}
                <div className="text-center text-xs text-muted-foreground my-4">
                  <p className="inline-block bg-gray-200 rounded-full px-3 py-1">
                    Negotiation started on {format(new Date(negotiation.createdAt), "PP")} for{' '}
                    <span className="font-medium">{negotiation.initialRequest.origin} to {negotiation.initialRequest.destination}</span>
                    {' '}at <span className="font-medium">{negotiation.initialRequest.price}</span>.
                  </p>
                  {negotiation.initialRequest.notes && (
                     <p className="mt-2 italic text-gray-600 max-w-md mx-auto">
                        Initial Notes: {negotiation.initialRequest.notes}
                     </p>
                  )}
                </div>

                {/* Combine Messages and Offers into a single chronological feed */}
                {[
                  ...(negotiation.counterOffers || []),
                  ...(negotiation.messages || [])
                ]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((item, index) => {
                  // Determine if the item is a message or an offer
                  const isMessage = 'content' in item;
                  const timestamp = new Date(item.timestamp);

                  if (isMessage) {
                    // --- Message Rendering ---
                    const messageItem = item as typeof negotiation.messages[0]; // Type assertion
                    const isUser = messageItem.sender === "user"; // Assuming 'user' represents the current user viewing

                    return (
                      <div
                        key={`msg-${index}`}
                        className={cn("flex", isUser ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg px-3 py-2 shadow-sm", // Base bubble style
                            isUser
                              ? "bg-blue-500 text-white" // User bubble style
                              : "bg-white border" // Carrier/Other bubble style
                          )}
                        >
                          <p className="text-sm">{messageItem.content}</p>
                          <p className={cn(
                              "text-xs mt-1 text-right", // Timestamp style
                              isUser ? "text-blue-200" : "text-muted-foreground"
                            )}
                            title={format(timestamp, "PPpp")} // Show full date on hover
                          >
                             {formatDistanceToNow(timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                     // --- Counter Offer Rendering ---
                    const offerItem = item as typeof negotiation.counterOffers[0]; // Type assertion
                    const isUserProposal = offerItem.proposedBy === "user";

                    return (
                      <div key={`offer-${index}`} className="text-center text-xs text-muted-foreground my-4">
                         <div className={cn(
                           "inline-block border rounded-lg px-4 py-2 text-left max-w-md mx-auto shadow-sm", // Offer block style
                            isUserProposal ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"
                         )}>
                          <div className="flex justify-between items-center mb-1">
                             <span className={cn(
                                 "font-semibold text-sm",
                                 isUserProposal ? "text-blue-700" : "text-amber-800"
                               )}>
                                {isUserProposal ? "Your Proposal" : "Carrier Proposal"}
                             </span>
                             <span className="text-xs text-muted-foreground" title={format(timestamp, "PPpp")}>
                                {formatDistanceToNow(timestamp, { addSuffix: true })}
                             </span>
                          </div>
                           <p className="text-base font-semibold text-gray-800 mb-1">{offerItem.price}</p>
                           {offerItem.notes && <p className="text-sm text-gray-600 italic mt-1">{offerItem.notes}</p>}
                           {offerItem.status !== 'pending' && (
                             <Badge
                                variant={
                                  offerItem.status === "accepted" ? "default" :
                                  offerItem.status === "rejected" ? "destructive" :
                                  "outline"
                                }
                                className="mt-2 text-xs"
                              >
                                {offerItem.status.charAt(0).toUpperCase() + offerItem.status.slice(1)}
                              </Badge>
                           )}
                         </div>
                       </div>
                    );
                  }
                })}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message input section */}
            <div className="border-t bg-gray-100 p-3 sm:p-4 sticky bottom-0 z-10 flex-shrink-0">
              <div className="flex items-start space-x-3 max-w-[900px] mx-auto">
                <Textarea
                  placeholder="Type your message or offer details..."
                  className="flex-1 min-h-[40px] max-h-[150px] sm:min-h-[44px] resize-none bg-white border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="h-10 w-10 flex-shrink-0 rounded-lg"
                  title="Send Message"
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
          
          {/* Details section (collapsible) */}
          <div className={cn(
            "w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-l bg-white overflow-y-auto transition-all duration-300 order-1 md:order-2",
             detailsExpanded ? "max-h-[50vh] md:max-h-full" : "max-h-12 md:max-h-full overflow-hidden"
          )}>
            <Card className="shadow-none border-0 rounded-none h-full flex flex-col">
               {/* Collapse Toggle Header */}
               <CardHeader
                 className="flex flex-row items-center justify-between py-2 px-4 border-b cursor-pointer sticky top-0 bg-white z-10"
                 onClick={() => setDetailsExpanded(!detailsExpanded)}
               >
                 <CardTitle className="text-base font-semibold flex items-center gap-2">
                   <Info className="h-4 w-4 text-muted-foreground" />
                   Negotiation Details
                 </CardTitle>
                 {detailsExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
               </CardHeader>

              {/* Content - Only render if expanded for performance? Or use conditional class */}
              <CardContent className={cn("p-4 flex-1 overflow-y-auto text-sm", !detailsExpanded && "hidden")}>
                <div className="space-y-6">
                  {/* Pricing Section */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Initial Price:</span>
                        <span className="font-medium">{initialPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Price:</span>
                        <span className="font-medium">{currentPrice}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between text-green-700 bg-green-50 px-2 py-1 rounded">
                          <span className="font-medium">Potential Savings:</span>
                          <span className="font-medium">
                            ${savings.toFixed(2)} ({savingsPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Timeline Section */}
                   <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                       <Clock className="h-4 w-4" />
                       Timeline & Status
                    </h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Status:</span>
                         <Badge
                          variant={
                            negotiation.status === "pending" ? "secondary" :
                            negotiation.status === "accepted" ? "default" :
                            negotiation.status === "rejected" ? "destructive" :
                            "outline"
                          }
                            className="px-1.5 py-0.5 text-xs"
                         >
                           {negotiation.status === "pending" ? "Active" :
                              negotiation.status.charAt(0).toUpperCase() + negotiation.status.slice(1)}
                         </Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Created:</span>
                         <span title={format(new Date(negotiation.createdAt), "PPpp")}>
                           {formatDistanceToNow(new Date(negotiation.createdAt), { addSuffix: true })}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Last Update:</span>
                         <span title={format(new Date(negotiation.updatedAt), "PPpp")}>
                           {formatDistanceToNow(new Date(negotiation.updatedAt), { addSuffix: true })}
                         </span>
                       </div>
                     </div>
                   </div>

                  {/* Initial Request Details Section */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                       <Package className="h-4 w-4" />
                       Shipment Details
                    </h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Commodity:</span>
                         <span>{negotiation.initialRequest.loadType}</span>
                       </div>
                       {negotiation.initialRequest.dimensions && (
                          <div className="flex justify-between items-center">
                             <span className="text-muted-foreground flex items-center gap-1"><Ruler className="h-3.5 w-3.5"/>Dimensions:</span>
                           <span>{negotiation.initialRequest.dimensions}</span>
                         </div>
                       )}
                       {negotiation.initialRequest.weight && (
                         <div className="flex justify-between items-center">
                             <span className="text-muted-foreground flex items-center gap-1"><Weight className="h-3.5 w-3.5"/>Weight:</span>
                           <span>{negotiation.initialRequest.weight}</span>
                         </div>
                       )}
                     </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 