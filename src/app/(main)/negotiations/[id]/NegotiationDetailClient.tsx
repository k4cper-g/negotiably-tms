"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
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
  Check,
  Settings2,
  Bot,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Define type for AgentSettingsModal props
interface AgentSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: any; // Type this more specifically based on your actual negotiation object
  targetPricePerKm: string;
  setTargetPricePerKm: (value: string) => void;
  isConfiguringAgent: boolean;
  agentStyle: "conservative" | "balanced" | "aggressive";
  setAgentStyle: React.Dispatch<React.SetStateAction<"conservative" | "balanced" | "aggressive">>;
  notifyOnPriceIncrease: boolean;
  setNotifyOnPriceIncrease: (value: boolean) => void;
  notifyOnNewTerms: boolean;
  setNotifyOnNewTerms: (value: boolean) => void;
  notifyAfterRounds: number;
  setNotifyAfterRounds: (value: number) => void;
  maxAutoReplies: number;
  setMaxAutoReplies: (value: number) => void;
  handleToggleAgent: (enabled: boolean) => Promise<void>;
  calculateCurrentPricePerKm: () => string | null;
}

// Extract the AgentSettingsModal component outside the main component
const AgentSettingsModal = memo(({
  isOpen,
  onOpenChange,
  negotiation,
  targetPricePerKm,
  setTargetPricePerKm,
  isConfiguringAgent,
  agentStyle,
  setAgentStyle,
  notifyOnPriceIncrease,
  setNotifyOnPriceIncrease,
  notifyOnNewTerms,
  setNotifyOnNewTerms,
  notifyAfterRounds,
  setNotifyAfterRounds,
  maxAutoReplies,
  setMaxAutoReplies,
  handleToggleAgent,
  calculateCurrentPricePerKm
}: AgentSettingsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center text-xl">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            AI Agent Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Main Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Enable AI Agent</Label>
                <Switch
                  checked={negotiation?.isAgentActive || false}
                  onCheckedChange={handleToggleAgent}
                  disabled={isConfiguringAgent || negotiation.status !== "pending"}
                />
              </div>
              
              {/* Price Target Section */}
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-3">Target Price Settings</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="modalTargetPrice">
                      Target Price per km (EUR/km)
                    </Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="modalTargetPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 1.25"
                        value={targetPricePerKm}
                        onChange={(e) => setTargetPricePerKm(e.target.value)}
                        disabled={isConfiguringAgent || (negotiation.isAgentActive && negotiation.status === "pending")}
                        className="w-full"
                      />
                    </div>
                    {calculateCurrentPricePerKm() && (
                      <p className="text-xs text-muted-foreground">
                        Current: ~{calculateCurrentPricePerKm()} EUR/km
                      </p>
                    )}
                  </div>

                  {/* Negotiation Style Section */}
                  <div className="space-y-1.5 pt-2">
                    <Label className="block mb-2">Negotiation Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={agentStyle === "conservative" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("conservative")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Conservative
                      </Button>
                      <Button 
                        variant={agentStyle === "balanced" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("balanced")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Balanced
                      </Button>
                      <Button 
                        variant={agentStyle === "aggressive" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setAgentStyle("aggressive")}
                        disabled={negotiation.isAgentActive}
                        className="w-full"
                      >
                        Aggressive
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {agentStyle === "conservative" ? "Cautious approach, prioritizes maintaining relationship." :
                       agentStyle === "balanced" ? "Balanced approach, seeks fair terms for both sides." :
                       "Assertive approach, focuses strongly on reaching target price."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Notification Settings Section */}
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md space-y-3">
                    <Label className="block">Notify me when:</Label>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="space-y-1">
                        <span className="text-sm">Price increases (moves away from target)</span>
                        <p className="text-xs text-muted-foreground">Alert when the carrier proposes a higher price</p>
                      </div>
                      <Switch 
                        checked={notifyOnPriceIncrease} 
                        onCheckedChange={setNotifyOnPriceIncrease}
                        disabled={negotiation.isAgentActive}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-1">
                      <div className="space-y-1">
                        <span className="text-sm">New terms mentioned</span>
                        <p className="text-xs text-muted-foreground">Alert when carrier mentions terms not in the initial offer</p>
                      </div>
                      <Switch 
                        checked={notifyOnNewTerms} 
                        onCheckedChange={setNotifyOnNewTerms}
                        disabled={negotiation.isAgentActive}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="maxRounds">
                        Maximum automatic replies
                      </Label>
                      <Select 
                        disabled={negotiation.isAgentActive}
                        value={maxAutoReplies.toString()}
                        onValueChange={(value) => setMaxAutoReplies(parseInt(value))}
                      >
                        <SelectTrigger className="w-full" id="maxRounds">
                          <SelectValue placeholder="Select max replies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 reply</SelectItem>
                          <SelectItem value="2">2 replies</SelectItem>
                          <SelectItem value="3">3 replies</SelectItem>
                          <SelectItem value="5">5 replies</SelectItem>
                          <SelectItem value="10">10 replies</SelectItem>
                          <SelectItem value="999">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Agent will notify you after this many exchanges
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label>Notify after rounds</Label>
                      <div className="flex items-center mt-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNotifyAfterRounds(Math.max(1, notifyAfterRounds - 1))}
                          disabled={negotiation.isAgentActive || notifyAfterRounds <= 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <div className="border rounded-md text-center py-2 flex-1">
                          {notifyAfterRounds}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNotifyAfterRounds(notifyAfterRounds + 1)}
                          disabled={negotiation.isAgentActive}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Rounds of negotiation before notification
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!negotiation.isAgentActive && (
            <Button 
              type="button" 
              onClick={() => handleToggleAgent(true)}
              disabled={isConfiguringAgent || !targetPricePerKm || isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0}
            >
              {isConfiguringAgent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              Activate Agent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

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
  const updateEmailSettings = useMutation(api.negotiations.updateEmailSettings);
  const configureAgent = useMutation(api.negotiations.configureAgent);
  
  // State for settings dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // State for AI agent
  const [targetPricePerKm, setTargetPricePerKm] = useState<string>('');
  const [isConfiguringAgent, setIsConfiguringAgent] = useState(false);
  
  // Advanced AI agent settings
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [notifyOnPriceIncrease, setNotifyOnPriceIncrease] = useState(true);
  const [notifyOnNewTerms, setNotifyOnNewTerms] = useState(true);
  const [notifyAfterRounds, setNotifyAfterRounds] = useState(5);
  const [maxAutoReplies, setMaxAutoReplies] = useState(3);
  const [agentStyle, setAgentStyle] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  
  // Agent settings modal
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false);
  
  // Handle toggling the AI agent (wrapped in useCallback for stable identity)
  const handleToggleAgent = useCallback(async (enabled: boolean) => {
    if (!negotiation) return;
    
    if (enabled && (!targetPricePerKm || isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0)) {
      alert("Please enter a valid target price per km to activate the agent.");
      return;
    }
    
    setIsConfiguringAgent(true);
    try {
      // Pass the full configuration including advanced settings
      await configureAgent({
        negotiationId: negotiation._id,
        isActive: enabled,
        targetPricePerKm: enabled ? parseFloat(targetPricePerKm) : undefined,
        agentSettings: enabled ? {
          style: agentStyle,
          notifyOnPriceIncrease,
          notifyOnNewTerms,
          maxAutoReplies,
          notifyAfterRounds,
        } : undefined,
      });
      
      console.log("Agent configuration submitted:", {
        isActive: enabled,
        targetPricePerKm: enabled ? parseFloat(targetPricePerKm) : undefined,
        settings: enabled ? { style: agentStyle, notifyOnPriceIncrease, notifyOnNewTerms, maxAutoReplies, notifyAfterRounds } : undefined
      });
      
      // Close modal if activating successfully from within it
      if (enabled && isAgentSettingsOpen) {
        setIsAgentSettingsOpen(false);
      }
      
      // Optional success notification
    } catch (error) {
      console.error("Failed to configure agent:", error);
      // Optional error notification
    } finally {
      setIsConfiguringAgent(false);
    }
  }, [negotiation, targetPricePerKm, configureAgent, agentStyle, notifyOnPriceIncrease, notifyOnNewTerms, maxAutoReplies, notifyAfterRounds, isAgentSettingsOpen]);
  
  // Create a stable callback for handling modal toggle
  const handleOpenAgentSettings = useCallback((open: boolean) => {
    setIsAgentSettingsOpen(open);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [negotiation?.messages]);
  
  // Effect to initialize dialog state
  useEffect(() => {
    if (negotiation) {
      setSubjectInput(negotiation.emailSubject || '');
      setCcInput(negotiation.emailCcRecipients?.join(', ') || '');
      
      // Initialize target price per km if agent is already active
      if (negotiation.isAgentActive && negotiation.agentTargetPricePerKm) {
        setTargetPricePerKm(negotiation.agentTargetPricePerKm.toString());
        
        // If the agent is already active, we could retrieve advanced settings
        // from the negotiation object in the future
        // For now, we'll use defaults
        if (negotiation.isAgentActive) {
          // TODO: In the future, these would come from the negotiation object
          // when backend support is added
          // const settings = negotiation.agentSettings || {};
          // setAgentStyle(settings.style || "balanced");
          // setNotifyOnPriceIncrease(settings.notifyOnPriceIncrease !== false);
          // setNotifyOnNewTerms(settings.notifyOnNewTerms !== false);
          // setNotifyAfterRounds(settings.notifyAfterRounds || 5);
          // setMaxAutoReplies(settings.maxAutoReplies || 3);
        }
      } else {
        // Suggest 10% less than current price/km as a starting point
        const currentPricePerKm = calculateCurrentPricePerKm();
        if (currentPricePerKm) {
          const suggestedTarget = (parseFloat(currentPricePerKm) * 0.9).toFixed(2);
          setTargetPricePerKm(suggestedTarget);
        }
      }
    }
  }, [negotiation]);
  
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
  
  // Function to calculate price per km (for display and suggestions)
  const calculateCurrentPricePerKm = () => {
    if (!negotiation || !negotiation.initialRequest.distance) return null;
    
    try {
      const currentPriceStr = latestOffer ? latestOffer.price : initialPrice;
      const priceValue = parseFloat(currentPriceStr.replace(/[^0-9.]/g, ""));
      const distanceValue = parseFloat(negotiation.initialRequest.distance.replace(/[^0-9.,]/g, "").replace(",", "."));
      
      if (isNaN(priceValue) || isNaN(distanceValue) || distanceValue === 0) return null;
      return (priceValue / distanceValue).toFixed(2);
    } catch (error) {
      console.error("Error calculating price per km:", error);
      return null;
    }
  };
  
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

  // Handle saving email settings
  const handleSaveSettings = async () => {
    if (!negotiation) return;
    setIsSavingSettings(true);
    try {
      const parsedCcArray = ccInput
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@')); // Basic filter for non-empty and containing @

      await updateEmailSettings({
        negotiationId: negotiation._id,
        subject: subjectInput.trim() === '' ? undefined : subjectInput.trim(), // Send undefined if empty
        ccRecipients: parsedCcArray,
      });
      // Optionally add toast notification for success
      setIsSettingsOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Failed to save email settings:", error);
      // Optionally add toast notification for error
    } finally {
      setIsSavingSettings(false);
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
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Email Settings"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Email Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right col-span-1">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="Default subject will be used if empty"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cc" className="text-right col-span-1">
                      CC
                    </Label>
                    <Input
                      id="cc"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      placeholder="Comma-separated emails"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                   <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                  <Button 
                    type="button" 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    const isAgent = messageItem.sender === "agent";
                    
                    // Group both user and agent messages to the right side
                    const isSenderSideRight = isUser || isAgent;
                    
                    // Extract sender name for display
                    let senderName = "";
                    if (isUser) {
                      senderName = "You";
                    } else if (isAgent) {
                      senderName = "AI Agent";
                    } else {
                      // Extract name from email if the format is "Email: email@example.com"
                      const emailMatch = messageItem.sender.match(/Email: (.*)/);
                      if (emailMatch && emailMatch[1]) {
                        // Extract everything before the @ symbol
                        const atIndex = emailMatch[1].indexOf('@');
                        senderName = atIndex > 0 ? emailMatch[1].substring(0, atIndex) : emailMatch[1];
                      } else {
                        senderName = messageItem.sender;
                      }
                    }

                    return (
                      <div
                        key={`msg-${index}`}
                        className={cn("flex", isSenderSideRight ? "justify-end" : "justify-start")}
                      >
                        <div className="flex flex-col max-w-[75%]">
                          {/* Sender name */}
                          <span className={cn(
                            "text-xs mb-1 px-1 font-medium",
                            isSenderSideRight ? "text-right" : "text-left",
                            isUser ? "text-blue-600" : 
                            isAgent ? "text-emerald-600" : "text-gray-600"
                          )}>
                            {isAgent && <Bot className="h-3 w-3 inline mr-1 mb-0.5" />}
                            {senderName}
                          </span>
                          
                          {/* Message bubble */}
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 shadow-sm", // Base bubble style
                              isUser
                                ? "bg-blue-500 text-white" // User bubble style
                                : isAgent
                                  ? "bg-emerald-500 text-white" // Agent bubble style
                                  : "bg-white border" // Carrier/Other bubble style
                            )}
                          >
                            <p className="text-sm">{messageItem.content}</p>
                            <p className={cn(
                                "text-xs mt-1 text-right", // Timestamp style
                                isUser ? "text-blue-200" : isAgent ? "text-emerald-200" : "text-muted-foreground"
                              )}
                              title={format(timestamp, "PPpp")} // Show full date on hover
                            >
                               {formatDistanceToNow(timestamp, { addSuffix: true })}
                            </p>
                          </div>
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
                
                {/* Agent typing indicator */}
                {negotiation.isAgentActive && negotiation.agentStatus === "negotiating" && (
                  <div className="flex justify-center my-2">
                    <div className="bg-emerald-100 text-emerald-700 rounded-lg px-3 py-2 text-sm flex items-center shadow-sm">
                      <Bot className="h-3.5 w-3.5 mr-2" />
                      <span className="mr-2">AI Agent is monitoring conversation</span>
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s" }}></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }}></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDuration: "1.5s", animationDelay: "0.6s" }}></span>
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message input section */}
            <div className="border-t bg-gray-100 p-3 sm:p-4 sticky bottom-0 z-10 flex-shrink-0">
              {/* Agent needs review alert */}
              {negotiation.isAgentActive && negotiation.agentStatus === "needs_review" && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm flex items-start gap-2">
                  <div className="text-amber-600 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">AI Agent needs your review</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      The agent has reached a point where human input is needed. Please review the conversation 
                      and take appropriate action.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Error alert */}
              {negotiation.isAgentActive && negotiation.agentStatus === "error" && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-sm flex items-start gap-2">
                  <div className="text-red-600 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">AI Agent encountered an error</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      There was a problem with the AI agent. You may need to deactivate and reactivate it, or continue negotiating manually.
                    </p>
                  </div>
                </div>
              )}
              
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

                  {/* AI Agent Section - Simplified for Sidebar */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Bot className="h-4 w-4" />
                      AI Negotiation Agent
                    </h3>
                    <div className="space-y-4 text-sm bg-gray-50 p-3 rounded-md">
                      {/* Agent Status */}
                      {negotiation.isAgentActive && (
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={
                                    negotiation.agentStatus === "negotiating" ? "default" :
                                    negotiation.agentStatus === "needs_review" ? "secondary" :
                                    negotiation.agentStatus === "error" ? "destructive" :
                                    "outline"
                                  }
                                  className="px-1.5 py-0.5 text-xs cursor-help"
                                >
                                  {negotiation.agentStatus || "Inactive"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {negotiation.agentStatus === "negotiating" ? 
                                  "The AI agent is actively working on your behalf to reach your target price" :
                                 negotiation.agentStatus === "needs_review" ? 
                                  "The agent has reached a point where human input is required" :
                                 negotiation.agentStatus === "error" ? 
                                  "The agent encountered an error and needs troubleshooting" :
                                  "Agent status is unknown"
                                }
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-xs text-muted-foreground">
                            {negotiation.agentStatus === "negotiating" ? "Actively negotiating" :
                             negotiation.agentStatus === "needs_review" ? "Needs your review" :
                             negotiation.agentStatus === "error" ? "Error - please check" :
                             "Status unknown"}
                          </span>
                        </div>
                      )}

                      {/* Main Controls */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Enable AI Agent</span>
                          <Switch
                            checked={negotiation?.isAgentActive || false}
                            onCheckedChange={handleToggleAgent}
                            disabled={isConfiguringAgent || negotiation.status !== "pending"}
                          />
                        </div>
                        
                        {negotiation.isAgentActive && negotiation.agentTargetPricePerKm && (
                          <p className="text-xs">
                            <span className="font-medium">Target price:</span> {negotiation.agentTargetPricePerKm} EUR/km
                          </p>
                        )}
                        
                        {/* Config Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => handleOpenAgentSettings(true)}
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-2" />
                          Configure Agent
                        </Button>
                        
                        <p className="text-xs text-muted-foreground">
                          The AI agent will negotiate on your behalf toward your target price.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Agent Settings Modal */}
      <AgentSettingsModal 
        isOpen={isAgentSettingsOpen}
        onOpenChange={handleOpenAgentSettings}
        negotiation={negotiation}
        targetPricePerKm={targetPricePerKm}
        setTargetPricePerKm={setTargetPricePerKm}
        isConfiguringAgent={isConfiguringAgent}
        agentStyle={agentStyle}
        setAgentStyle={setAgentStyle}
        notifyOnPriceIncrease={notifyOnPriceIncrease}
        setNotifyOnPriceIncrease={setNotifyOnPriceIncrease}
        notifyOnNewTerms={notifyOnNewTerms}
        setNotifyOnNewTerms={setNotifyOnNewTerms}
        notifyAfterRounds={notifyAfterRounds}
        setNotifyAfterRounds={setNotifyAfterRounds}
        maxAutoReplies={maxAutoReplies}
        setMaxAutoReplies={setMaxAutoReplies}
        handleToggleAgent={handleToggleAgent}
        calculateCurrentPricePerKm={calculateCurrentPricePerKm}
      />
    </div>
  );
} 