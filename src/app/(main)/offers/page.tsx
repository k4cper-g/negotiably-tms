"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart2,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Truck,
  Info,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Loader2,
  Pin,
  MessageSquare,
  Award,
  Bot,
  Settings2,
  Wand2,
  ArrowUpDown, // Added
  MoreHorizontal, // Added
  ChevronDown,
  Cog,
  CogIcon,
  Settings,
  Eraser,
  RemoveFormatting,
  MessagesSquare,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast, // Added
  X,
  ChevronUp,
  Mail,
  Save,
  Trash2 // Import Trash icon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from "next/link";
import { useState, useEffect, useRef, ChangeEvent, useCallback, memo } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import * as React from "react"; // Added
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState, // Added
  PaginationState, // Added
} from "@tanstack/react-table"; // Added
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added
import { mockOffers } from "@/data/mockOffers"; // Import the mock data
import { useOffers, OfferFilters } from '@/lib/offers/useOffers';
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import debounce from 'lodash/debounce';
import {
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter, 
  DrawerTrigger, 
  DrawerClose 
} from "@/components/ui/drawer";

// Dynamic import of map components to avoid SSR issues with Leaflet
const TransportMap = dynamic(() => import('@/components/TransportMap'), {
  ssr: false,
  loading: () => <div className="h-[60vh] flex items-center justify-center bg-muted">Loading map...</div>
});

// Define interface for transport offer
interface TransportOffer {
  id: string;
  origin: string;
  originCoords: string;
  destination: string;
  destinationCoords: string;
  distance: string;
  price: string;
  pricePerKm: string;
  carrier: string;
  loadType: string;
  vehicle: string;
  weight: string;
  dimensions: string;
  loadingDate: string;
  deliveryDate: string;
  status: string;
  platform: string;
  lastUpdated: string;
  dateCreated: string;
  description: string;
  contact: string;
  offerContactEmail?: string;
  rating: number;
}

// Define interface for active filter
interface ActiveFilter {
  type: string;
  value: string;
}

interface AiEvaluationResult {
  rank: number;
  reason: string;
}

// Component for showing transport offer details in a dialog
function TransportOfferDetails({ offer }: { offer: TransportOffer }) {
  const [mapKey, setMapKey] = useState(0);
  const createNegotiation = useMutation(api.negotiations.createNegotiation);
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newNegotiationId, setNewNegotiationId] = useState<Id<"negotiations"> | null>(null);
  
  // Force map re-render when offer changes
  useEffect(() => {
    setMapKey(prev => prev + 1);
    setNewNegotiationId(null); // Reset negotiation ID when offer changes
  }, [offer]);
  
  const handleRequestTransport = async () => {
    // If we already have a negotiation, navigate to the full page
    if (newNegotiationId) {
      router.push(`/negotiations/${newNegotiationId}`);
      return;
    }
    
    try {
      setIsCreating(true);
      // Create a new negotiation, passing the email
      const result = await createNegotiation({
        offerId: offer.id,
        initialRequest: {
          origin: offer.origin,
          destination: offer.destination,
          price: offer.price,
          distance: offer.distance, // Pass distance
          loadType: offer.loadType,
          weight: offer.weight,
          dimensions: offer.dimensions,
          carrier: offer.carrier,
          offerContactEmail: offer.offerContactEmail, // Pass the email
          notes: `Request for transport from ${offer.origin} to ${offer.destination}`,
        },
      });
      
      // Extract the negotiation ID from the result
      const negotiationId = result.negotiationId as Id<"negotiations">;
      setNewNegotiationId(negotiationId);
      
      // Navigate to the full negotiation page
      router.push(`/negotiations/${negotiationId}`);
    } catch (error) {
      console.error("Error creating negotiation:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // --- Layout With Drawer --- 
  return (
    <div className="space-y-5 px-4 py-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{offer.platform}</Badge>
          <Badge variant="outline">{offer.loadType}</Badge>
          {offer.vehicle && <Badge variant="outline">{offer.vehicle}</Badge>}
        </div>
        <Badge 
          variant={offer.status === "Available" ? "secondary" : offer.status === "Pending" ? "secondary" : "outline"}
        >
          {offer.status}
        </Badge>
      </div>

      {/* Map Preview */}
      <div className="h-[200px] w-full rounded-lg overflow-hidden border my-4">
        <TransportMap 
          key={mapKey} // Ensure map re-renders when offer changes
          offers={[offer]} // Pass only the current offer
          selectedOfferId={offer.id} // Select the current offer by default
          onRouteSelect={() => {}} // Disable selection change from map preview
          onOpenDetails={() => {}} // Disable opening details from map preview
          interactionEnabled={true} // Enable map interaction (zoom, pan)
        />
      </div>

      <div className="flex flex-col gap-2 bg-muted/40 p-3 rounded-lg">
        <div className="flex items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
          <div>
            <span className="font-medium text-base">{offer.origin}</span>
            {offer.originCoords && (
              <span className="text-xs text-muted-foreground block">{offer.originCoords}</span>
            )}
          </div>
        </div>
        <div className="ml-[5px] h-10 border-l border-dashed border-gray-300"></div>
        <div className="flex items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
          <div>
            <span className="font-medium text-base">{offer.destination}</span>
            {offer.destinationCoords && (
              <span className="text-xs text-muted-foreground block">{offer.destinationCoords}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-muted/30 p-3 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="font-medium">{offer.distance}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="font-medium text-lg">{offer.price}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Price per km</p>
          <p className="font-medium">{offer.pricePerKm}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Carrier</p>
          <p className="font-medium">{offer.carrier}</p>
        </div>
      </div>

      {/* More offer details in a cleaner layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 border rounded-md">
          <p className="text-xs text-muted-foreground">Weight</p>
          <p className="font-medium">{offer.weight || "Not specified"}</p>
        </div>
        <div className="p-2 border rounded-md">
          <p className="text-xs text-muted-foreground">Dimensions</p>
          <p className="font-medium">{offer.dimensions || "Not specified"}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 border rounded-md">
          <p className="text-xs text-muted-foreground">Loading Date</p>
          <p className="font-medium">{offer.loadingDate || "Not specified"}</p>
        </div>
        <div className="p-2 border rounded-md">
          <p className="text-xs text-muted-foreground">Delivery Date</p>
          <p className="font-medium">{offer.deliveryDate || "Not specified"}</p>
        </div>
      </div>

      {/* Contact and description */}
      {(offer.contact || offer.offerContactEmail) && (
        <div className="p-3 border rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Contact</p>
          {offer.contact && <p className="font-medium">{offer.contact}</p>}
          {offer.offerContactEmail && <p className="text-sm">{offer.offerContactEmail}</p>}
        </div>
      )}
      
      {offer.description && (
        <div className="p-3 border rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="text-sm">{offer.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <DrawerFooter className="px-0 pb-0 mt-2">
        <Button
          onClick={handleRequestTransport}
          disabled={isCreating || !!newNegotiationId}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Negotiation...
            </>
          ) : newNegotiationId ? (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              View Negotiation
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Transport
            </>
          )}
        </Button>
      </DrawerFooter>
    </div>
  );
}

// OfferCard component for individual transport offers
function OfferCard({ 
  offer, 
  onSelect, 
  aiResult // Add aiResult prop
}: { 
  offer: TransportOffer; // Use defined TransportOffer type
  onSelect: (id: string) => void; 
  aiResult?: AiEvaluationResult; // Make aiResult optional
}) {
  const createNegotiation = useMutation(api.negotiations.createNegotiation);
  const updateEmailSettings = useMutation(api.negotiations.updateEmailSettings); // Add updateEmailSettings
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newNegotiationId, setNewNegotiationId] = useState<Id<"negotiations"> | null>(null);
  
  const handleRequestTransport = async () => {
    // If we already have a negotiation, navigate to the full page
    if (newNegotiationId) {
      router.push(`/negotiations/${newNegotiationId}`);
      return;
    }
    
    try {
      setIsCreating(true);
      // Create a new negotiation
      const result = await createNegotiation({
        offerId: offer.id,
        initialRequest: {
          origin: offer.origin,
          destination: offer.destination,
          price: offer.price,
          distance: offer.distance, // Pass distance
          loadType: offer.loadType,
          weight: offer.weight,
          dimensions: offer.dimensions,
          carrier: offer.carrier,
          notes: `Request for transport from ${offer.origin} to ${offer.destination}`,
        },
      });
      
      // Extract the negotiation ID from the result
      const negotiationId = result.negotiationId as Id<"negotiations">;
      setNewNegotiationId(negotiationId);
      
      // Navigate to the full negotiation page
      router.push(`/negotiations/${negotiationId}`);
    } catch (error) {
      console.error("Error creating negotiation:", error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Function to get adaptive rank colors
  const getRankColorClasses = (rank: number): string => {
    switch (rank) {
      // Use more adaptive/neutral colors that work in both modes
      // Using border color for the rank indication, background for subtle highlight
      case 1: return "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950"; 
      case 2: return "border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-900"; 
      case 3: return "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950"; 
      default: return "border-transparent";
    }
  };
  
  const rankClasses = getRankColorClasses(aiResult?.rank ?? 0);

  return (
    <Card className={cn(
        "h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200 border-2 bg-muted",
        rankClasses
      )}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 border-b flex items-center justify-between">
        <Badge variant="outline" className="bg-background/80 font-medium text-xs">
          {offer.id}
        </Badge>
        {aiResult && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={cn("font-bold text-xs", rankClasses)}> 
                  <Award className="h-3 w-3 mr-1" />
                  Rank #{aiResult.rank}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-md text-left">
                <p className="text-sm font-semibold mb-1">AI Evaluation:</p>
                <p className="text-xs">{aiResult.reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="text-xs font-medium text-primary">
          {offer.platform}
        </div>
      </div>
      
      <CardHeader className="pb-1 pt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <h3 className="font-medium text-sm">{offer.origin}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <h3 className="font-medium text-sm">{offer.destination}</h3>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1">
            <p className="text-sm text-muted-foreground">{offer.distance}</p>
            <Badge 
              variant={offer.status === "Available" ? "success" : offer.status === "Pending" ? "secondary" : "outline"}
              className="text-xs"
            >
              {offer.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 py-0">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-semibold text-base text-primary">{offer.price}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Per km</p>
            <p className="font-medium">{offer.pricePerKm}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Carrier</p>
            <p className="font-medium truncate" title={offer.carrier}>{offer.carrier}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vehicle</p>
            <p className="font-medium">{offer.vehicle}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="font-medium">{offer.weight}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dimensions</p>
            <p className="font-medium">{offer.dimensions}</p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {offer.description}
        </div>
        
        <div className="bg-background/50 -mx-6 px-6 py-2 mt-auto border-t text-xs flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Loading:</span>
            <span className="font-medium text-foreground">{offer.loadingDate}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Delivery:</span>
            <span className="font-medium text-foreground">{offer.deliveryDate}</span>
          </div>
        </div>
      </CardContent>
      
      <div className="p-3 border-t bg-muted flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => onSelect(offer.id)} className="w-full">
          <Info className="h-3.5 w-3.5 mr-1" />
          Details
        </Button>
      </div>
    </Card>
  );
}

// Define columns for the table
const columns: ColumnDef<TransportOffer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] cursor-pointer"
        onClick={(e) => e.stopPropagation()} // Prevent row click from triggering when clicking checkbox
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="w-[80px] truncate">{row.getValue("id")}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "route", // Custom accessor for combined route
    header: "Route",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
          {row.original.origin}
        </div>
        <div className="flex items-center mt-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
          {row.original.destination}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "distance",
    header: ({ column }) => (
       <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        Distance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.getValue("distance"),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("price")}</div>,
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle",
  },
  {
    accessorKey: "dates", // Custom accessor for combined dates
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 data-[state=open]:bg-accent"
      >
        Dates
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    sortingFn: (rowA, rowB) => { // Custom sorting for dates
       const dateA = new Date(rowA.original.loadingDate).getTime();
       const dateB = new Date(rowB.original.loadingDate).getTime();
       return dateA - dateB;
    },
    cell: ({ row }) => (
       <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Load: {row.original.loadingDate}</span>
          <span className="text-xs text-muted-foreground mt-1">Delivery: {row.original.deliveryDate}</span>
       </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
         <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
           ${
             status === "Available"
               ? "bg-green-100 text-green-800"
               : status === "Pending"
               ? "bg-neutral-100 text-neutral-800"
               : "bg-neutral-100 text-neutral-800"
           }
         `}>
           {status}
         </div>
      );
    },
    filterFn: (row, id, value) => { // Enable filtering for status
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "platform",
    header: "Platform",
    filterFn: (row, id, value) => { // Enable filtering for platform
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
       // Access the handleOpenOfferDetails function from the table meta
      const { handleOpenOfferDetails } = table.options.meta as { handleOpenOfferDetails: (id: string) => void };
      const offer = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()} // Prevent row selection toggle
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenOfferDetails(offer.id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Start Negotiation (soon)</DropdownMenuItem>
             {/* Add more actions here if needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

// Define interface for agent settings modal props
interface AgentSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  negotiationMode: "pricePerKm" | "percentage";
  setNegotiationMode: (mode: "pricePerKm" | "percentage") => void;
  targetPricePerKm: string;
  setTargetPricePerKm: (value: string) => void;
  targetPercentage: string;
  setTargetPercentage: (value: string) => void;
  agentStyle: "conservative" | "balanced" | "aggressive";
  setAgentStyle: React.Dispatch<React.SetStateAction<"conservative" | "balanced" | "aggressive">>;
  notifyOnPriceChange: boolean;
  setNotifyOnPriceChange: (value: boolean) => void;
  notifyOnNewTerms: boolean;
  setNotifyOnNewTerms: (value: boolean) => void;
  notifyAfterRounds: number;
  setNotifyAfterRounds: (value: number) => void;
  maxAutoReplies: number;
  setMaxAutoReplies: (value: number) => void;
  notifyOnTargetPriceReached: boolean;
  setNotifyOnTargetPriceReached: (value: boolean) => void;
  notifyOnConfusion: boolean;
  setNotifyOnConfusion: (value: boolean) => void;
  notifyOnRefusal: boolean;
  setNotifyOnRefusal: (value: boolean) => void;
  isAgentActive: boolean;
  setIsAgentActive: (value: boolean) => void;
  // New props for template sending
  sendTemplateOnCreate: boolean;
  setSendTemplateOnCreate: (value: boolean) => void;
  templateContent: string;
  setTemplateContent: (value: string) => void;
  // New props for email subject and cc
  emailSubject: string;
  setEmailSubject: (value: string) => void;
  emailCc: string;
  setEmailCc: (value: string) => void;
}

// Extract the AgentSettingsModal component
const AgentSettingsModal = memo(({
  isOpen,
  onOpenChange,
  negotiationMode,
  setNegotiationMode,
  targetPricePerKm,
  setTargetPricePerKm,
  targetPercentage,
  setTargetPercentage,
  agentStyle,
  setAgentStyle,
  notifyOnPriceChange,
  setNotifyOnPriceChange,
  notifyOnNewTerms,
  setNotifyOnNewTerms,
  notifyAfterRounds,
  setNotifyAfterRounds,
  maxAutoReplies,
  setMaxAutoReplies,
  notifyOnTargetPriceReached,
  setNotifyOnTargetPriceReached,
  notifyOnConfusion,
  setNotifyOnConfusion,
  notifyOnRefusal,
  setNotifyOnRefusal,
  isAgentActive,
  setIsAgentActive,
  // Destructure new props
  sendTemplateOnCreate,
  setSendTemplateOnCreate,
  templateContent,
  setTemplateContent,
  // New props for email subject and cc
  emailSubject,
  setEmailSubject,
  emailCc,
  setEmailCc
}: AgentSettingsModalProps) => {
  const calculateTargetPrice = (offer: any) => {
    if (negotiationMode === "percentage" && targetPercentage) {
      const percentageValue = parseFloat(targetPercentage);
      if (!isNaN(percentageValue)) {
        const initialPrice = parseNumericPrice(offer?.price) || 0;
        if (initialPrice > 0) {
          const targetPrice = initialPrice * (1 + percentageValue / 100);
          return `€${targetPrice.toFixed(2)}`;
        }
      }
    }
    return null;
  };

  const parseNumericPrice = (priceString?: string) => {
    if (!priceString) return null;
    // Extract digits and decimal point/comma from the price string
    const match = priceString.match(/(\d+[.,]?\d*)/);
    if (match && match[1]) {
      // Convert to a normalized format with dot as decimal separator
      const normalizedNumber = match[1].replace(',', '.');
      return parseFloat(normalizedNumber);
    }
    return null;
  };
  
  // Fetch email templates
  const emailTemplates = useQuery(api.emailTemplates.getEmailTemplates);
  const createEmailTemplate = useMutation(api.emailTemplates.createEmailTemplate);
  const deleteEmailTemplate = useMutation(api.emailTemplates.deleteEmailTemplate); // Add delete mutation
  
  // Local state for the debounced textarea
  const [localTemplateContent, setLocalTemplateContent] = useState(templateContent);
  // Local state for the new template name input
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState<Id<"emailTemplates"> | null>(null); // State for delete confirmation
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("custom"); // Keep track of selected template

  // Update local state when prop changes (e.g., template selected)
  useEffect(() => {
    setLocalTemplateContent(templateContent);
  }, [templateContent]);
  
  // Debounced function to update parent state
  const updateTemplateContent = useCallback(
    debounce((value: string) => {
      setTemplateContent(value);
    }, 300),
    [setTemplateContent]
  );
  
  // Handler for textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalTemplateContent(newValue); // Update local state immediately
    updateTemplateContent(newValue); // Debounce update to parent
  };
  
  // Handler for selecting a template from dropdown
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId); // Update selected ID state
    if (templateId === "custom") {
      // Optionally clear textarea or keep current content when selecting custom
      // setTemplateContent(""); // Example: clear textarea
      return; 
    }
    // Explicitly type selectedTemplate
    const selectedTemplate: Doc<"emailTemplates"> | undefined = emailTemplates?.find((t: Doc<"emailTemplates">) => t._id === templateId);
    if (selectedTemplate) {
      setTemplateContent(selectedTemplate.content);
    }
  };
  
  // Handler for saving the current content as a new template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Template name cannot be empty.");
      return;
    }
    if (!localTemplateContent.trim()) {
      toast.error("Template content cannot be empty.");
      return;
    }

    try {
      await createEmailTemplate({
        name: newTemplateName,
        content: localTemplateContent,
      });
      toast.success(`Template "${newTemplateName}" saved successfully!`);
      setNewTemplateName(""); // Clear the input field
      // The useQuery will automatically refetch and update the dropdown
    } catch (error) { 
      console.error("Failed to save template:", error);
      toast.error("Failed to save template.", { description: (error as Error).message });
    }
  };

  // Handler for initiating template deletion
  const handleDeleteConfirmation = (templateId: Id<"emailTemplates">) => {
    setTemplateToDelete(templateId);
    // The AlertDialog trigger will open the dialog
  };

  // Handler for confirming and executing template deletion
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await deleteEmailTemplate({ templateId: templateToDelete });
      toast.success("Template deleted successfully!");
      setTemplateToDelete(null); // Close the dialog
      // If the deleted template was selected, reset selection to custom
      if (selectedTemplateId === templateToDelete) {
          handleTemplateSelect("custom"); // Reset dropdown and potentially content
      }
      // Query will refetch automatically
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template.", { description: (error as Error).message });
      setTemplateToDelete(null); // Close the dialog even on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <DialogTitle className="flex items-center text-xl text-card-foreground">
            <Settings className="mr-2 h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Main Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-ai-agent" className="text-base font-medium flex items-center">
                  <Bot className="h-4 w-4 mr-2 text-primary"/>
                  Enable AI Agent
                </Label>
                <Switch
                  id="enable-ai-agent"
                  checked={isAgentActive}
                  onCheckedChange={(checked) => {
                    setIsAgentActive(checked);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-2 pl-6">Let the AI handle the negotiation automatically based on your settings below.</p>
              
              {isAgentActive && (
                <div className="mt-3 pl-6 space-y-6">
                  {/* Price Target Section */}
                  <div className="border-t pt-4 mt-4"> 
                    <h3 className="font-medium mb-3">Target Price Settings</h3>
                    {/* Toggle between price/km and percentage modes */}
                    <div className="mb-4">
                      <Label className="block mb-2">Negotiation Mode</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={negotiationMode === "pricePerKm" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setNegotiationMode("pricePerKm")}
                          className="w-full"
                        >
                          Price per km
                        </Button>
                        <Button 
                          variant={negotiationMode === "percentage" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setNegotiationMode("percentage")}
                          className="w-full"
                        >
                          Percentage
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {negotiationMode === "pricePerKm" ? (
                        // Price per km input
                        <div className="space-y-1.5">
                          <Label htmlFor="targetPrice">
                            Target EUR/km
                          </Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              id="targetPrice"
                              type="number"
                              step="0.01"
                              value={targetPricePerKm}
                              onChange={(e) => {
                                setTargetPricePerKm(e.target.value);
                              }}
                              placeholder="e.g., 1.10"
                              className={cn(
                                "w-full",
                                targetPricePerKm && (isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0) && "border-red-500"
                              )}
                            />
                          </div>
                          {targetPricePerKm && (isNaN(parseFloat(targetPricePerKm)) || parseFloat(targetPricePerKm) <= 0) && (
                            <p className="text-xs text-red-500 mt-1">
                              Please enter a valid positive number
                            </p>
                          )}
                        </div>
                      ) : (
                        // Percentage-based input for target above current price
                        <div className="space-y-1.5">
                          <Label htmlFor="targetPercentage">
                            Target % Above Starting Price
                          </Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              id="targetPercentage"
                              type="number"
                              step="1"
                              value={targetPercentage}
                              onChange={(e) => {
                                setTargetPercentage(e.target.value);
                              }}
                              placeholder="e.g., 10"
                              className={cn(
                                "w-full",
                                targetPercentage && (isNaN(parseFloat(targetPercentage)) || parseFloat(targetPercentage) <= 0) && "border-red-500"
                              )}
                            />
                            <span>%</span>
                          </div>
                          {targetPercentage && (isNaN(parseFloat(targetPercentage)) || parseFloat(targetPercentage) <= 0) && (
                            <p className="text-xs text-red-500 mt-1">
                              Please enter a valid positive number
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Agent Behavior Section */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Agent Behavior</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="block mb-2">Negotiation Style</Label>
                        <div className="flex flex-col space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <Button 
                              variant={agentStyle === "conservative" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setAgentStyle("conservative")}
                              className="w-full"
                            >
                              Conservative
                            </Button>
                            <Button 
                              variant={agentStyle === "balanced" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setAgentStyle("balanced")}
                              className="w-full"
                            >
                              Balanced
                            </Button>
                            <Button 
                              variant={agentStyle === "aggressive" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setAgentStyle("aggressive")}
                              className="w-full"
                            >
                              Aggressive
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {agentStyle === "conservative" && "Accepts offers more readily, prioritizes maintaining relationship over maximum profit."}
                            {agentStyle === "balanced" && "Balanced approach to negotiations, reasonable counteroffers."}
                            {agentStyle === "aggressive" && "Pushes harder for better terms, may risk the deal to maximize profit."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notification Settings */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Notification Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnPriceChange">Notify on price changes</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when the carrier changes the price
                          </p>
                        </div>
                        <Switch
                          id="notifyOnPriceChange"
                          checked={notifyOnPriceChange}
                          onCheckedChange={setNotifyOnPriceChange}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnNewTerms">Notify on new terms</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when new terms are introduced
                          </p>
                        </div>
                        <Switch
                          id="notifyOnNewTerms"
                          checked={notifyOnNewTerms}
                          onCheckedChange={setNotifyOnNewTerms}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnTargetPriceReached">Notify when target price reached</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when your target price is reached
                          </p>
                        </div>
                        <Switch
                          id="notifyOnTargetPriceReached"
                          checked={notifyOnTargetPriceReached}
                          onCheckedChange={setNotifyOnTargetPriceReached}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnConfusion">Notify on negotiation confusion</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified if the AI agent gets confused
                          </p>
                        </div>
                        <Switch
                          id="notifyOnConfusion"
                          checked={notifyOnConfusion}
                          onCheckedChange={setNotifyOnConfusion}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyOnRefusal">Notify on refusal</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified if the carrier refuses to negotiate
                          </p>
                        </div>
                        <Switch
                          id="notifyOnRefusal"
                          checked={notifyOnRefusal}
                          onCheckedChange={setNotifyOnRefusal}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="space-y-1.5">
                        <Label>Maximum auto-replies</Label>
                        <Select
                          value={String(maxAutoReplies)}
                          onValueChange={(value) => setMaxAutoReplies(parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select max auto-replies" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 message</SelectItem>
                            <SelectItem value="2">2 messages</SelectItem>
                            <SelectItem value="3">3 messages</SelectItem>
                            <SelectItem value="5">5 messages</SelectItem>
                            <SelectItem value="10">10 messages</SelectItem>
                            <SelectItem value="20">20 messages</SelectItem>
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
                            disabled={notifyAfterRounds <= 1}
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
              )}

              {/* Send Initial Template Section - Moved outside the AI agent section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="send-template" className="text-base font-medium flex items-center">
                     <Mail className="h-4 w-4 mr-2"/>
                     Send Initial Email Template
                  </Label>
                  <Switch
                    id="send-template"
                    checked={sendTemplateOnCreate}
                    onCheckedChange={(checked) => {
                      setSendTemplateOnCreate(checked);
                    }}
                  />
                </div>
                 <p className="text-xs text-muted-foreground mt-1 pl-6">
                   {isAgentActive && sendTemplateOnCreate 
                     ? "Send a predefined email message as the first step, then let the AI agent handle responses."
                     : "Send a predefined email message to the contact when creating negotiations."}
                 </p>
                {sendTemplateOnCreate && (
                  <div className="mt-3 pl-6 space-y-3">
                    {/* Template Selector Dropdown */} 
                    <div>
                      <Label htmlFor="template-select">Load Template</Label>
                      <Select 
                        value={selectedTemplateId} // Control the Select component value
                        onValueChange={handleTemplateSelect}
                      >
                        <SelectTrigger id="template-select" className="mt-1">
                          <SelectValue placeholder="Select a template or write custom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom / New</SelectItem>
                          {emailTemplates?.map((template: Doc<"emailTemplates">) => (
                            // Simplify to just the SelectItem without delete button
                            <SelectItem key={template._id} value={template._id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Email Content Textarea */}
                    <div className="space-y-1.5">
                      <Label htmlFor="template-content">Email Content</Label>
                      <Textarea
                        id="template-content"
                        placeholder="Select a template or write your email content here...\n\nPlaceholders:\n[Origin], [Destination], [Price]"
                        value={localTemplateContent}
                        onChange={handleTextareaChange}
                        rows={10}
                        className="text-sm h-[200px]"
                      />
                    </div>

                    {/* Template Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Save as Template Button & Dialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={!localTemplateContent.trim()}>
                            <Save className="mr-2 h-4 w-4"/>
                            Save as Template
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Save New Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Enter a name for this email template.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-2">
                             <Label htmlFor="template-name">Template Name</Label>
                             <Input 
                               id="template-name"
                               value={newTemplateName}
                               onChange={(e) => setNewTemplateName(e.target.value)}
                               placeholder="e.g., Initial Contact Offer"
                               className="mt-1"
                             />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setNewTemplateName("")}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSaveAsTemplate} disabled={!newTemplateName.trim()}>Save</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {/* Remove Template Button - Only shown when a saved template is selected */}
                      {selectedTemplateId !== 'custom' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4"/>
                              Remove Template
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the selected template "
                                {emailTemplates?.find(t => t._id === selectedTemplateId)?.name || ''}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  // Use the templateToDelete state to trigger deletion
                                  setTemplateToDelete(selectedTemplateId as Id<"emailTemplates">);
                                  handleDeleteTemplate();
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Template
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Email Settings Section - Moved to the bottom */}
              <div className="border-t pt-4 mt-4">
                
                <div className="space-y-3">
                  {/* Email Subject */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      placeholder="Email Subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for all email communications including AI agent responses
                    </p>
                  </div>

                  {/* Email CC */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email-cc">CC (Comma-separated)</Label>
                    <Input
                      id="email-cc"
                      placeholder="cc1@example.com, cc2@example.com"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                  </div>
                </div>
              </div>
            </div> 
          </div> 
        </div> 

 
        <DialogFooter className="px-6 py-4 border-t bg-muted/40">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          {/* Add a primary save/apply button here if needed for the overall settings */}
          <Button onClick={() => onOpenChange(false)}>Apply Settings</Button> 
        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
});

// Add the custom drawer component after imports:
// Custom drawer implementation to replace shadcn Drawer
interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

function CustomDrawer({ isOpen, onClose, title, children }: CustomDrawerProps) {
  return (
    <div 
      className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div className="h-full bg-background border-l shadow-lg flex flex-col w-full max-w-md">
        <div className="border-b pb-3 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const router = useRouter();
  const createNegotiation = useMutation(api.negotiations.createNegotiation);
  const configureAgent = useMutation(api.negotiations.configureAgent);
  const updateEmailSettings = useMutation(api.negotiations.updateEmailSettings); // Add email settings mutation
  const addMessage = useMutation(api.negotiations.addMessage); // Import addMessage mutation
  const { openNegotiation } = useNegotiationModal();
  const evaluateOffersAction = useAction(api.offers.evaluateOffers);

  const {
    offers: filteredOffers,
    isLoading,
    filters,
    setFilters,
    totalCount,
    pageCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    resetFilters
  } = useOffers();

  // Map view state
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [selectedOfferForModal, setSelectedOfferForModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isCreatingNegotiation, setIsCreatingNegotiation] = useState(false);
  const [isCreatingBatchNegotiations, setIsCreatingBatchNegotiations] = useState(false);
  const [negotiationIdMap, setNegotiationIdMap] = useState<Record<string, Id<"negotiations">>>({});
  const [aiEvaluationResults, setAiEvaluationResults] = useState<Record<string, any>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false); // Add AI loading state
  const [pendingFilters, setPendingFilters] = useState<OfferFilters>(filters); // State for pending filters

  // Track filter change sources to prevent unwanted sync
  const filterChangeSource = useRef<"reset" | "apply" | "refresh" | "external" | null>(null);

  // Sync pendingFilters with filters when filters change externally
  useEffect(() => {
    if (filterChangeSource.current === "external" || filterChangeSource.current === null) {
      setPendingFilters(filters);
    }
    filterChangeSource.current = null;
  }, [filters]);
  
  // AI Tool Preferences
  const [useWeatherTool, setUseWeatherTool] = useState(true);
  const [useRouteTool, setUseRouteTool] = useState(true);
  const [useTollsTool, setUseTollsTool] = useState(true);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // AI Agent Settings State
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [targetPricePerKm, setTargetPricePerKm] = useState("");
  const [negotiationMode, setNegotiationMode] = useState<"pricePerKm" | "percentage">("pricePerKm");
  const [targetPercentage, setTargetPercentage] = useState("");
  const [agentStyle, setAgentStyle] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [notifyOnPriceChange, setNotifyOnPriceChange] = useState(true);
  const [notifyOnNewTerms, setNotifyOnNewTerms] = useState(true);
  const [maxAutoReplies, setMaxAutoReplies] = useState(3);
  const [notifyAfterRounds, setNotifyAfterRounds] = useState(5);
  const [notifyOnTargetPriceReached, setNotifyOnTargetPriceReached] = useState(true);
  const [notifyOnConfusion, setNotifyOnConfusion] = useState(true);
  const [notifyOnRefusal, setNotifyOnRefusal] = useState(true);
  // State for template sending
  const [sendTemplateOnCreate, setSendTemplateOnCreate] = useState(false);
  const [templateContent, setTemplateContent] = useState("");
  // New props for email subject and cc
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCc, setEmailCc] = useState("");

  // Filter handlers - update pending filters
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };
  
  const handleOriginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFilters(prev => ({ ...prev, origin: e.target.value }));
  };
  
  const handleDestinationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFilters(prev => ({ ...prev, destination: e.target.value }));
  };
  
  const handlePlatformChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, platform: value === 'all' ? undefined : value }));
  };
  
  const handleStatusChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }));
  };
  
  const handleMinPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFilters(prev => ({ ...prev, minPrice: parseInt(e.target.value) || undefined }));
  };
  
  const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || undefined }));
  };
  
  const handleLoadTypeChange = (value: string) => {
    setPendingFilters(prev => ({ ...prev, loadType: value === 'all' ? undefined : value }));
  };

  // Function to apply pending filters
  const handleApplyFilters = () => {
    filterChangeSource.current = "apply";
    
    // First get all keys with values in the current active filters
    const activeFilterKeys = Object.keys(filters);
    
    // If we're applying empty filters, explicitly set all active filter keys to undefined
    if (Object.keys(pendingFilters).length === 0 && activeFilterKeys.length > 0) {
      const resetObj: OfferFilters = {};
      activeFilterKeys.forEach(key => {
        // @ts-expect-error - Dynamic key assignment
        resetObj[key] = undefined;
      });
      setFilters(resetObj);
    } else {
      // Apply the pending filters normally
      setFilters(pendingFilters);
    }
  };

  // Function to reset filters UI only without affecting data
  const handleResetFilters = () => {
    setPendingFilters({});
  };
  
  // Handler for opening the details modal
  const handleOpenOfferDetails = (offerId: string) => {
    setSelectedOfferForModal(offerId);
  };

  // Refresh data without changing filters
  const handleRefreshData = () => {
    filterChangeSource.current = "refresh";
    // Clone the current filters to trigger a re-fetch without changing filter values
    setFilters({...filters});
  };
  
  // Clear filters and refresh data
  const handleClearAndRefresh = () => {
    filterChangeSource.current = "reset";
    
    // Explicitly set all filter values to undefined to ensure a complete reset
    const resetObj: OfferFilters = {};
    Object.keys(filters).forEach(key => {
      // @ts-expect-error - Dynamic key assignment
      resetObj[key] = undefined;
    });
    setFilters(resetObj);
  };

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: filteredOffers,
    columns,
    pageCount: pageCount, // Provide the total page count from the hook
    manualPagination: true, // Tell the table pagination is handled manually
    getRowId: (originalRow) => originalRow.id, // Use the unique offer ID for row identification
    autoResetPageIndex: false, // Prevent table from resetting page index on data change
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize
      }
    },
    meta: {
      handleOpenOfferDetails,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: currentPage - 1, pageSize });
        setCurrentPage(newState.pageIndex + 1);
        setPageSize(newState.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // AI Search function 
  const handleAiSearchClick = async () => {
    setIsAiLoading(true); // Set AI loading true
    const offersToEvaluate = table.getSortedRowModel().rows.map(row => row.original);

    if (offersToEvaluate.length === 0) {
      setIsAiLoading(false); // Set AI loading false if no offers
      return;
    }

    const currentSortBy = sorting.length > 0 ? `${sorting[0].id} (${sorting[0].desc ? 'desc' : 'asc'})` : 'default';
    const searchContext = {
      filters: {
        searchTerm: filters.searchTerm || "",
        originFilter: filters.origin || "",
        destinationFilter: filters.destination || "",
        platformFilter: filters.platform || "",
        statusFilter: filters.status || "",
        minPrice: filters.minPrice?.toString() || "",
        maxPrice: filters.maxPrice?.toString() || "",
        loadTypeFilter: filters.loadType || "",
        sortBy: currentSortBy,
        maxResults: offersToEvaluate.length,
      },
      offers: offersToEvaluate,
      useWeatherTool,
      useRouteTool,
      useTollsTool,
    };

    try {
      const results = await evaluateOffersAction(searchContext);
      setAiEvaluationResults(results);
    } catch (error) {
      console.error("Error evaluating offers:", error);
    } finally {
      setIsAiLoading(false); // Set AI loading false
    }
  };

  // Helper function to parse price
  const parseNumericPrice = (priceString?: string) => {
    if (!priceString) return null;
    // Extract digits and decimal point/comma from the price string
    const match = priceString.match(/(\d+[.,]?\d*)/);
    if (match && match[1]) {
      // Convert to a normalized format with dot as decimal separator
      const normalizedNumber = match[1].replace(',', '.');
      return parseFloat(normalizedNumber);
    }
    return null;
  };

  // Handle batch negotiation creation
  const handleCreateBatchNegotiations = async () => {
    try {
      setIsCreatingBatchNegotiations(true);
      
      // Get selected offer IDs
      const selectedOfferIds = Object.keys(rowSelection);
      
      if (selectedOfferIds.length === 0) {
        console.error("No offers selected");
        return;
      }
      
      // Create negotiations for each selected offer
      const negotiationIds: Id<"negotiations">[] = [];
      
      for (const offerId of selectedOfferIds) {
        const offer = filteredOffers.find(o => o.id === offerId);
        
        if (!offer) continue;
        
        // Create a new negotiation
        const result = await createNegotiation({
          offerId: offer.id,
          initialRequest: {
            origin: offer.origin,
            destination: offer.destination,
            price: offer.price,
            distance: offer.distance,
            loadType: offer.loadType,
            weight: offer.weight,
            dimensions: offer.dimensions,
            carrier: offer.carrier,
            offerContactEmail: offer.offerContactEmail, // Pass the email
            notes: `Request for transport from ${offer.origin} to ${offer.destination}`,
          },
        });
        
        const negotiationId = result.negotiationId as Id<"negotiations">;
        negotiationIds.push(negotiationId);
        
        // Update email settings if subject or cc is provided
        if (emailSubject.trim() || emailCc.trim()) {
          // Parse CC emails
          const ccRecipients = emailCc
            ? emailCc.split(',').map(e => e.trim()).filter(e => e && e.includes('@'))
            : undefined;
            
          // Call updateEmailSettings with subject and cc
          await updateEmailSettings({
            negotiationId,
            subject: emailSubject.trim() || undefined,
            ccRecipients: ccRecipients && ccRecipients.length > 0 ? ccRecipients : undefined,
          });
        }
        
        // --- Logic based on settings --- 
        // Send template if enabled
        if (sendTemplateOnCreate) {
          if (offer.offerContactEmail && templateContent) {
             console.log(`[Batch Create] Scheduling email send for negotiation: ${negotiationId} to ${offer.offerContactEmail}`);
             // Call backend action to send template email using the imported addMessage
             await addMessage({
               negotiationId,
               message: templateContent,
               sender: "user",
             });
             
             // The addMessage mutation will automatically trigger email sending
             console.log(`Scheduled email template for negotiation: ${negotiationId}`);
          } else {
             console.warn(`[Batch Create] Cannot send template for ${negotiationId}: Missing email or template content.`);
          }
        }
        
        // Configure AI agent if enabled (regardless of template sending)
        if (isAgentActive) {
          let targetPricePerKmValue: number | undefined;
          
          if (negotiationMode === "pricePerKm") {
            // Use direct input value
            targetPricePerKmValue = parseFloat(targetPricePerKm);
          } else if (negotiationMode === "percentage") {
            // Calculate price per km from percentage
            const percentageValue = parseFloat(targetPercentage);
            if (!isNaN(percentageValue)) {
              const initialPrice = parseNumericPrice(offer.price) || 0;
              const distance = parseNumericPrice(offer.distance) || 0;
              
              if (initialPrice > 0 && distance > 0) {
                // Calculate the target price per km based on percentage
                const targetPrice = initialPrice * (1 + percentageValue / 100);
                targetPricePerKmValue = targetPrice / distance;
              }
            }
          }
          
          // Only configure if we have a valid target price value
          if (targetPricePerKmValue && !isNaN(targetPricePerKmValue)) {
            try {
              // Use the same structure as in NegotiationDetailClient.tsx
              await configureAgent({
                negotiationId: negotiationId,
                isActive: true,
                targetPricePerKm: targetPricePerKmValue,
                agentSettings: {
                  style: agentStyle,
                  notifyOnPriceChange: notifyOnPriceChange,
                  notifyOnNewTerms: notifyOnNewTerms,
                  maxAutoReplies: maxAutoReplies,
                  notifyAfterRounds: notifyAfterRounds,
                  notifyOnTargetPriceReached: notifyOnTargetPriceReached,
                  notifyOnConfusion: notifyOnConfusion,
                  notifyOnRefusal: notifyOnRefusal,
                  bypassTargetPriceCheck: false,
                  bypassConfusionCheck: false,
                  bypassRefusalCheck: false
                }
              });
              console.log(`AI agent configured for negotiation: ${negotiationId}`);
            } catch (configError) {
              console.error("Error configuring AI agent:", configError);
            }
          }
        }
      }
      
      // Show success message with appropriate context based on enabled features
      let successDescription = "";
      if (sendTemplateOnCreate && isAgentActive) {
        successDescription = "Initial email templates have been sent and AI agents have been configured to handle responses.";
      } else if (sendTemplateOnCreate) {
        successDescription = "Email templates have been sent to the contacts.";
      } else if (isAgentActive) {
        successDescription = "AI agent has been activated for all negotiations.";
      }
      
      toast.success(`Created ${negotiationIds.length} negotiations`, {
        description: successDescription || undefined
      });
      
      // Reset row selection
      table.resetRowSelection();
      
      // Navigate to negotiations page
      router.push("/negotiations");
    } catch (error) {
      console.error("Error creating batch negotiations:", error);
    } finally {
      setIsCreatingBatchNegotiations(false);
    }
  };

  // Handle opening agent settings
  const handleOpenAgentSettings = (open: boolean) => {
    setIsAgentSettingsOpen(open);
  };

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Transport Offers</h1>
          <p className="text-muted-foreground">Manage and track all your freight offers from different marketplaces</p>
        </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshData} 
                disabled={isLoading}
                className="gap-2 h-9 px-3 min-w-[100px] flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="inline-flex items-center"> 
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    <span>Refresh</span>
                  </span>
                )}
              </Button>
      </div>

      {/* Search and Filters */}
      <Card className="overflow-hidden">
        <CardContent className="px-4"> {/* Adjusted padding */}
          <div className="space-y-4"> {/* Use space-y for better structure */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"> {/* Adjusted gap */}
              {/* Search, Origin, Destination */}
              <div className="space-y-1.5 md:col-span-4"> {/* Adjusted spacing */}
                <Label htmlFor="main-search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="main-search"
                    placeholder="ID, route, carrier..." 
                    className="pl-8 h-9" 
                    value={pendingFilters.searchTerm || ''}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="origin-filter">Origin</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="origin-filter"
                    placeholder="Country or city..." 
                    className="pl-8 h-9" 
                    value={pendingFilters.origin || ''}
                    onChange={handleOriginChange}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="destination-filter">Destination</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="destination-filter"
                    placeholder="Country or city..." 
                    className="pl-8 h-9"
                    value={pendingFilters.destination || ''}
                    onChange={handleDestinationChange}
                  />
                </div>
              </div>
              
              {/* Platform, Status, Load Type */}
              <div className="space-y-1.5 md:col-span-3">
                <Label>Platform</Label>
                <Select value={pendingFilters.platform || 'all'} onValueChange={handlePlatformChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    <SelectItem value="TimoCom">TimoCom</SelectItem>
                    <SelectItem value="Trans.eu">Trans.eu</SelectItem>
                    <SelectItem value="Freightos">Freightos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label>Status</Label>
                <Select value={pendingFilters.status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 md:col-span-3">
                <Label>Load Type</Label>
                <Select value={pendingFilters.loadType || 'all'} onValueChange={handleLoadTypeChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="General Cargo">General Cargo</SelectItem>
                    <SelectItem value="Palletized">Palletized</SelectItem>
                    <SelectItem value="Temperature Controlled">Temperature Controlled</SelectItem>
                    <SelectItem value="Fragile Goods">Fragile Goods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price Range */}
              <div className="space-y-1.5 md:col-span-3">
                <Label>Price Range</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Min €"
                    type="number" // Use number input
                    className="h-9 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Hide number arrows
                    value={pendingFilters.minPrice || ''}
                    onChange={handleMinPriceChange}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input 
                    placeholder="Max €" 
                    type="number"
                    className="h-9 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={pendingFilters.maxPrice || ''}
                    onChange={handleMaxPriceChange}
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 md:col-span-12 pt-2"> {/* Added border */}
                <div className="flex items-end gap-2 self-end"> {/* Reset + Manual Search */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
                          Reset Filters
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear filter inputs without refreshing data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button size="sm" onClick={handleApplyFilters} className="h-9" disabled={isLoading}> 
                    <Filter className="h-4 w-4 mr-1.5" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Modes */}
      <Tabs 
        value={activeTab} // Control active tab state
        className="space-y-4"
        onValueChange={(value) => {
          setActiveTab(value);
          table.resetRowSelection(); // Clear selection when changing tabs
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 h-8"> {/* Responsive layout */}
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
          
          {/* Selection & Controls Bar - Combined layout */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Left side: Action buttons for selected items */}
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-2 py-1 px-2 bg-muted/50 border rounded-md">
                <span className="text-sm">
                  {Object.keys(rowSelection).length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => table.resetRowSelection()}
                  className="h-8 px-2 text-xs"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
          
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => setIsAgentSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="gap-1.5 h-8"
                    disabled={isCreatingBatchNegotiations}
                    onClick={handleCreateBatchNegotiations}
                  >
                    {isCreatingBatchNegotiations ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <MessagesSquare className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Right side: Table controls (only visible for list view) */}
            {activeTab === 'list' && (
              <div className="flex items-center gap-2 justify-end flex-wrap ml-auto">
                {/* Column Visibility Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Page Size Select */}
                <div className="flex items-center space-x-2">
                  <Select
                    value={pageSize.toString()} // Use pageSize state
                    onValueChange={(value) => setPageSize(parseInt(value))} // Use setPageSize
                  >
                    <SelectTrigger id="page-size-select" className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Page Size Select for Grid and Map Views */}
            {(activeTab === 'grid' || activeTab === 'map') && (
              <div className="flex items-center gap-2 justify-end flex-wrap ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => setPageSize(parseInt(value))}
                  >
                    <SelectTrigger id="page-size-select" className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-md border overflow-hidden"> {/* Removed min-h */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        // Map header IDs to appropriate width/min-width classes
                        const headerClassMap: { [key: string]: string } = {
                          select: "w-12",
                          id: "w-[100px]",
                          route: "min-w-[180px]",
                          distance: "min-w-[120px]",
                          price: "min-w-[100px]",
                          vehicle: "min-w-[150px]",
                          dates: "min-w-[180px]",
                          status: "min-w-[100px]",
                          platform: "min-w-[120px]",
                          actions: "w-12",
                        };
                        return (
                          // Apply the mapped class to the TableHead
                          <TableHead key={header.id} colSpan={header.colSpan} className={cn(headerClassMap[header.id])}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton Loading Rows
                    Array(pageSize).fill(0).map((_, i) => (
                      <TableRow key={`loading-${i}`} className="animate-pulse h-[60.7px]">
                        <TableCell><div className="h-4 w-4 bg-muted rounded"></div></TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-28"></div>
                            <div className="h-4 bg-muted rounded w-28"></div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-24"></div></TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-4 bg-muted rounded w-24"></div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-20"></div></TableCell>
                        <TableCell><div className="h-5 bg-muted rounded w-16"></div></TableCell>
                        <TableCell><div className="h-8 w-8 bg-muted rounded"></div></TableCell>
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows?.length ? (
                    // Actual Data Rows
                    table.getRowModel().rows.map((row) => {
                       const aiResult = aiEvaluationResults[row.original.id];
                       const getRowRankClass = (rank?: number) => {
                         switch (rank) {
                            // Apply dark variants for background colors
                           case 1: return "bg-yellow-50 dark:bg-yellow-950 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/60";
                           case 2: return "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800/60";
                           case 3: return "bg-orange-50 dark:bg-orange-950 hover:bg-orange-100/80 dark:hover:bg-orange-900/60";
                           // Use hover:bg-muted/50 for default hover
                           default: return "hover:bg-muted/50"; 
                         }
                       };
                       const rankClass = getRowRankClass(aiResult?.rank);
                      
                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                           // Apply rankClass and selected state background
                          className={cn(
                             row.getIsSelected() ? 'bg-primary/5' : rankClass,
                             "transition-colors"
                           )}
                          onClick={(e) => {
                            // Check if click is in the first cell (checkbox column)
                            const target = e.target as HTMLElement;
                            const isCheckboxCell = target.closest('td') === 
                              e.currentTarget.querySelector('td:first-child');
                            
                            // Only navigate if not clicking the checkbox cell
                            if (!isCheckboxCell) {
                              handleOpenOfferDetails(row.original.id);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                              {/* Tooltip for AI Rank on ID column - text colors should adapt */}
                               {cell.column.id === 'id' && aiResult && (
                                 <TooltipProvider>
                                   <Tooltip delayDuration={100}>
                                     <TooltipTrigger asChild>
                                       <Award 
                                         className={cn(
                                           "h-4 w-4 ml-2 inline-block align-middle",
                                           aiResult.rank === 1 && 'text-yellow-500 dark:text-yellow-400',
                                           aiResult.rank === 2 && 'text-slate-500 dark:text-slate-400',
                                           aiResult.rank === 3 && 'text-orange-500 dark:text-orange-400'
                                         )}
                                       />
                                     </TooltipTrigger>
                                     <TooltipContent side="right" className="max-w-xs">
                                       <p className="text-sm font-semibold mb-1">AI Rank #{aiResult.rank}</p>
                                       <p className="text-xs">{aiResult.reason}</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    // No Results Row
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No offers found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2">
             <div className="flex-1 text-sm text-muted-foreground">
               {Object.keys(rowSelection).length} of{" "} {/* Use length of rowSelection state */}
               {table.getFilteredRowModel().rows.length} row(s) selected.
             </div>
             <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-2"
                  title="First page"
                >
                  <ChevronFirst className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-2"
                  title="Previous page"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-2"
                  title="Next page"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-2"
                  title="Last page"
                >
                  <ChevronLast className="h-3 w-3" />
                </Button>
              </div>
          </div>
        </TabsContent>

        {/* Grid View Content */}
        <TabsContent value="grid" className="space-y-4">
           <div className="min-h-[600px]">
            {/* ... existing grid loading/empty/data states ... */}
             {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-1">
                 {/* Skeleton Cards */}
                {Array(pageSize).fill(0).map((_, i) => ( <Card key={`skeleton-${i}`} className="h-full flex flex-col overflow-hidden animate-pulse"> <div className="bg-muted px-3 py-2 border-b flex items-center justify-between"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> <CardHeader className="pb-1 pt-3"> <div className="space-y-2"> <div className="flex items-center gap-2"> <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div> <div className="h-4 bg-muted-foreground/20 rounded w-28"></div> </div> <div className="flex items-center gap-2"> <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div> <div className="h-4 bg-muted-foreground/20 rounded w-32"></div> </div> <div className="flex items-center justify-between pt-1"> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> </div> </div> </CardHeader> <CardContent className="flex-1 py-0"> <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4"> <div> <div className="h-3 bg-muted-foreground/20 rounded w-8 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-12 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-14"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-24"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-24"></div> </div> </div> <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div> <div className="bg-muted/30 -mx-6 px-6 py-2 mt-auto border-t flex justify-between items-center"> <div className="flex flex-col gap-1"> <div className="h-3 bg-muted-foreground/20 rounded w-14"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> <div className="flex flex-col items-end gap-1"> <div className="h-3 bg-muted-foreground/20 rounded w-14"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> </div> </CardContent> <div className="p-3 border-t bg-background flex items-center justify-between gap-2"> <div className="h-8 bg-muted-foreground/20 rounded w-full"></div> </div> </Card> ))}
              </div>
             ) : filteredOffers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[600px]">
                <p className="text-muted-foreground">No offers found matching your criteria.</p>
              </div>
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-1">
                {filteredOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer} 
                    onSelect={(id) => handleOpenOfferDetails(id)} // Use the shared handler
                    aiResult={aiEvaluationResults[offer.id]} 
                  />
                ))}
              </div>
            )}
           </div>

          {/* Pagination Controls for Grid View */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {filteredOffers.length} of {totalCount} offers
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1 || isLoading}
                className="h-8 px-2"
                title="First page"
              >
                <ChevronFirst className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage <= 1 || isLoading}
                className="h-8 px-2"
                title="Previous page"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage < pageCount ? currentPage + 1 : pageCount)}
                disabled={currentPage >= pageCount || isLoading}
                className="h-8 px-2"
                title="Next page"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pageCount)}
                disabled={currentPage >= pageCount || isLoading}
                className="h-8 px-2"
                title="Last page"
              >
                <ChevronLast className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Map View Content */}
        <TabsContent value="map" className="space-y-4">
          <div 
            ref={mapContainerRef}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[705px]"
          >
            {/* Offers list sidebar (map view specific list) */}
            <div className="lg:col-span-1 border rounded-lg overflow-hidden shadow-sm bg-card">
              <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                <h3 className="font-medium">Available Routes</h3>
                <div className="text-xs text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                    </span>
                  ) : (
                    `${filteredOffers.length} of ${totalCount} shown` // Show total count too
                  )}
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(700px-48px-40px)]"> {/* Adjust height for pagination */}
                 {/* Loading/Empty/Data states for map list */}
                 {isLoading ? (
                   <div className="space-y-0"> {Array(pageSize).fill(0).map((_, i) => ( <div key={`map-skeleton-${i}`} className="p-3 border-b animate-pulse"> <div className="flex justify-between items-start mb-2"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-5 bg-muted-foreground/20 rounded w-20"></div> </div> <div className="space-y-3"> <div className="grid grid-cols-[16px_1fr] gap-1.5"> <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div> <div className="h-4 bg-muted-foreground/20 rounded w-28"></div> </div> <div className="grid grid-cols-[16px_1fr] gap-1.5"> <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div> <div className="h-4 bg-muted-foreground/20 rounded w-32"></div> </div> </div> <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-4 bg-muted-foreground/20 rounded w-14"></div> </div> </div> ))} </div>
                 ) : filteredOffers.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full"> <p className="text-sm text-muted-foreground">No offers found</p> </div>
                 ) : (
                   filteredOffers.map((offer) => (
                     <div 
                       key={offer.id}
                       className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${selectedOffer === offer.id ? 'bg-muted' : ''}`}
                       onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                     >
                       {/* ... Map list item content ... */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{offer.id}</div>
                          <Badge variant="outline" className="text-xs"> {offer.platform} </Badge>
                       </div>
                       <div className="space-y-2">
                         <div className="grid grid-cols-[16px_1fr] gap-1.5">
                           <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5"></div>
                           <div className="text-sm truncate">{offer.origin}</div>
                         </div>
                         <div className="grid grid-cols-[16px_1fr] gap-1.5">
                           <div className="h-2.5 w-2.5 rounded-full bg-green-500 mt-1.5"></div>
                           <div className="text-sm truncate">{offer.destination}</div>
                         </div>
                       </div>
                       <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                         <div className="text-sm font-medium">{offer.price}</div>
                         <div className="text-xs text-muted-foreground">{offer.distance}</div>
                       </div>
                     </div>
                   ))
                 )}
              </div>
              
              {/* Pagination Controls for Map View Sidebar */}
              <div className="p-2 border-t bg-muted/30 flex justify-between items-center">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-7 px-1 text-xs"
                    title="First page"
                  >
                    <ChevronFirst className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-7 px-1 text-xs"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentPage}/{pageCount}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage < pageCount ? currentPage + 1 : pageCount)}
                    disabled={currentPage >= pageCount || isLoading}
                    className="h-7 px-1 text-xs"
                    title="Next page"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pageCount)}
                    disabled={currentPage >= pageCount || isLoading}
                    className="h-7 px-1 text-xs"
                    title="Last page"
                  >
                    <ChevronLast className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Map container */}
            <Card className="lg:col-span-3 h-[700px] p-0">
              <CardContent className="p-0 h-full">
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center h-full space-y-3"> <Loader2 className="h-10 w-10 animate-spin text-primary/70" /> </div>
                 ) : (
                  <TransportMap 
                    offers={filteredOffers} // Pass filtered offers to map
                    selectedOfferId={selectedOffer} 
                    onRouteSelect={(offerId) => setSelectedOffer(selectedOffer === offerId ? null : offerId)} 
                    onOpenDetails={handleOpenOfferDetails} // Use shared handler
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      
      {/* Replace with CustomDrawer */}
      <CustomDrawer
        isOpen={!!selectedOfferForModal}
        onClose={() => setSelectedOfferForModal(null)}
        title="Transport Offer Details"
      >
        {selectedOfferForModal && (
          <TransportOfferDetails
            offer={filteredOffers.find(o => o.id === selectedOfferForModal) as TransportOffer}
          />
        )}
      </CustomDrawer>
      
      {/* Agent Settings Modal */}
      <AgentSettingsModal 
        isOpen={isAgentSettingsOpen}
        onOpenChange={handleOpenAgentSettings}
        negotiationMode={negotiationMode}
        setNegotiationMode={setNegotiationMode}
        targetPricePerKm={targetPricePerKm}
        setTargetPricePerKm={setTargetPricePerKm}
        targetPercentage={targetPercentage}
        setTargetPercentage={setTargetPercentage}
        agentStyle={agentStyle}
        setAgentStyle={setAgentStyle}
        notifyOnPriceChange={notifyOnPriceChange}
        setNotifyOnPriceChange={setNotifyOnPriceChange}
        notifyOnNewTerms={notifyOnNewTerms}
        setNotifyOnNewTerms={setNotifyOnNewTerms}
        notifyAfterRounds={notifyAfterRounds}
        setNotifyAfterRounds={setNotifyAfterRounds}
        maxAutoReplies={maxAutoReplies}
        setMaxAutoReplies={setMaxAutoReplies}
        notifyOnTargetPriceReached={notifyOnTargetPriceReached}
        setNotifyOnTargetPriceReached={setNotifyOnTargetPriceReached}
        notifyOnConfusion={notifyOnConfusion}
        setNotifyOnConfusion={setNotifyOnConfusion}
        notifyOnRefusal={notifyOnRefusal}
        setNotifyOnRefusal={setNotifyOnRefusal}
        isAgentActive={isAgentActive}
        setIsAgentActive={setIsAgentActive}
        sendTemplateOnCreate={sendTemplateOnCreate}
        setSendTemplateOnCreate={setSendTemplateOnCreate}
        templateContent={templateContent}
        setTemplateContent={setTemplateContent}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailCc={emailCc}
        setEmailCc={setEmailCc}
      />
    </div>
  );
} 