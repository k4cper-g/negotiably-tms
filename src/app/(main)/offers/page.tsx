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
  MessagesSquare, // Added
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { Id } from "../../../../convex/_generated/dataModel";
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
  
  // --- Layout Without Map --- 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{offer.platform}</Badge>
          <Badge variant="outline">{offer.loadType}</Badge>
        </div>
        <Badge variant={offer.status === "Available" ? "secondary" : "outline"}>
          {offer.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-2"></span>
          <span className="font-medium text-base">{offer.origin}</span>
          <span className="text-xs text-muted-foreground ml-2">{offer.originCoords}</span>
        </div>
        <div className="ml-[5px] h-12 border-l border-dashed border-gray-300"></div>
        <div className="flex items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
          <span className="font-medium text-base">{offer.destination}</span>
          <span className="text-xs text-muted-foreground ml-2">{offer.destinationCoords}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Distance</p>
          <p className="font-medium">{offer.distance}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="font-medium">{offer.price}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Price per km</p>
          <p className="font-medium">{offer.pricePerKm}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Carrier</p>
          <p className="font-medium">{offer.carrier}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Loading Date</p>
          <p className="font-medium">{offer.loadingDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Delivery Date</p>
          <p className="font-medium">{offer.deliveryDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Weight</p>
          <p className="font-medium">{offer.weight}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dimensions</p>
          <p className="font-medium">{offer.dimensions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vehicle</p>
          <p className="font-medium">{offer.vehicle}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Rating</p>
          <p className="font-medium">{offer.rating} / 5</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Description</p>
        <p className="mt-1">{offer.description}</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Contact</p>
        <p className="font-medium">{offer.contact}</p>
        {/* Display Email if it exists */}
        {offer.offerContactEmail && (
          <p className="font-medium">{offer.offerContactEmail}</p>
        )}
      </div>

      {/* Map section is removed */}

      <div className="flex items-center justify-end pt-4 border-t">
        <Button 
          onClick={handleRequestTransport}
          disabled={isCreating}
          className="gap-1"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Negotiation...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>Start Negotiation</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
  // --- End Layout Without Map ---
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
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-400 bg-yellow-50 text-yellow-700"; // Gold
      case 2: return "border-gray-400 bg-gray-100 text-gray-700"; // Silver
      case 3: return "border-orange-400 bg-orange-50 text-orange-700"; // Bronze
      default: return "border-transparent";
    }
  };

  return (
    <Card className={`h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200 border-2 ${getRankColor(aiResult?.rank ?? 0)}`}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 border-b flex items-center justify-between">
        <Badge variant="outline" className="bg-background/80 font-medium text-xs">
          {offer.id}
        </Badge>
        {/* AI Rank Badge */} 
        {aiResult && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`font-bold text-xs ${getRankColor(aiResult.rank)}`}>
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
              className={`text-xs ${
                offer.status === "Available" 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : offer.status === "Pending" 
                  ? "bg-orange-100 text-orange-800 hover:bg-orange-100" 
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
              }`}
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
        
        <div className="bg-muted/30 -mx-6 px-6 py-2 mt-auto border-t text-xs flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Loading:</span>
            <span className="font-medium">{offer.loadingDate}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Delivery:</span>
            <span className="font-medium">{offer.deliveryDate}</span>
          </div>
        </div>
      </CardContent>
      
      <div className="p-3 border-t bg-background flex items-center justify-between gap-2">
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
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
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
               ? "bg-orange-100 text-orange-800"
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


export default function OffersPage() {
  const router = useRouter();
  const createNegotiation = useMutation(api.negotiations.createNegotiation);
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

  // AI Tool Preferences
  const [useWeatherTool, setUseWeatherTool] = useState(true);
  const [useRouteTool, setUseRouteTool] = useState(true);
  const [useTollsTool, setUseTollsTool] = useState(true);

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
    setFilters(pendingFilters);
  };

  // Function to reset filters (both pending and active)
  const handleResetFilters = () => {
    setPendingFilters({}); // Clear pending filters
    resetFilters(); // Reset active filters via the hook
  };
  
  // Handler for opening the details modal
  const handleOpenOfferDetails = (offerId: string) => {
    setSelectedOfferForModal(offerId);
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transport Offers</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setFilters({})} 
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
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
                    Reset Filters
                  </Button>
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
                  <Button variant="outline" size="sm" className="h-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="gap-1.5 h-8"
                    disabled={isCreatingBatchNegotiations}
                  >
                    {isCreatingBatchNegotiations ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <MessagesSquare className="h-3.5 w-3.5" />
                        {/* <span>Negotiate</span> */}
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
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
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
                    Array(10).fill(0).map((_, i) => (
                      <TableRow key={`loading-${i}`} className="animate-pulse">
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
                           case 1: return "bg-yellow-50 hover:bg-yellow-100/80";
                           case 2: return "bg-gray-100 hover:bg-gray-200/80";
                           case 3: return "bg-orange-50 hover:bg-orange-100/80";
                           default: return "hover:bg-muted/50";
                         }
                       };
                       const rankClass = getRowRankClass(aiResult?.rank);
                      
                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className={`${row.getIsSelected() ? 'bg-primary/5' : rankClass} transition-colors cursor-pointer`}
                          onClick={() => handleOpenOfferDetails(row.original.id)} // Open details on row click
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                              {/* Tooltip for AI Rank on ID column */}
                               {cell.column.id === 'id' && aiResult && (
                                 <TooltipProvider>
                                   <Tooltip delayDuration={100}>
                                     <TooltipTrigger asChild>
                                       <Award 
                                         className={`h-4 w-4 ml-2 inline-block align-middle
                                           ${aiResult.rank === 1 ? 'text-yellow-500' : ''}
                                           ${aiResult.rank === 2 ? 'text-gray-500' : ''}
                                           ${aiResult.rank === 3 ? 'text-orange-500' : ''}
                                         `}
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
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
          </div>
        </TabsContent>

        {/* Grid View Content (remains mostly the same) */}
        <TabsContent value="grid" className="space-y-4">
           <div className="min-h-[600px]">
            {/* ... existing grid loading/empty/data states ... */}
             {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-1">
                 {/* Skeleton Cards */}
                {Array(8).fill(0).map((_, i) => ( <Card key={`skeleton-${i}`} className="h-full flex flex-col overflow-hidden animate-pulse"> <div className="bg-muted px-3 py-2 border-b flex items-center justify-between"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> <CardHeader className="pb-1 pt-3"> <div className="space-y-2"> <div className="flex items-center gap-2"> <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div> <div className="h-4 bg-muted-foreground/20 rounded w-28"></div> </div> <div className="flex items-center gap-2"> <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div> <div className="h-4 bg-muted-foreground/20 rounded w-32"></div> </div> <div className="flex items-center justify-between pt-1"> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> </div> </div> </CardHeader> <CardContent className="flex-1 py-0"> <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4"> <div> <div className="h-3 bg-muted-foreground/20 rounded w-8 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-12 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-14"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-24"></div> </div> <div> <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div> <div className="h-5 bg-muted-foreground/20 rounded w-24"></div> </div> </div> <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div> <div className="bg-muted/30 -mx-6 px-6 py-2 mt-auto border-t flex justify-between items-center"> <div className="flex flex-col gap-1"> <div className="h-3 bg-muted-foreground/20 rounded w-14"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> <div className="flex flex-col items-end gap-1"> <div className="h-3 bg-muted-foreground/20 rounded w-14"></div> <div className="h-4 bg-muted-foreground/20 rounded w-20"></div> </div> </div> </CardContent> <div className="p-3 border-t bg-background flex items-center justify-between gap-2"> <div className="h-8 bg-muted-foreground/20 rounded w-full"></div> </div> </Card> ))}
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
        </TabsContent>

        {/* Map View Content (remains mostly the same) */}
        <TabsContent value="map" className="space-y-4">
          <div 
            ref={mapContainerRef}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[700px]"
          >
            {/* Offers list sidebar (map view specific list) */}
            <div className="lg:col-span-1 border rounded-lg overflow-hidden shadow-sm bg-card h-[700px]">
              <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                <h3 className="font-medium">Available Routes</h3>
                <div className="text-xs text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                    </span>
                  ) : (
                    `${filteredOffers.length} shown` // Use filteredOffers length
                  )}
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(700px-48px)]">
                 {/* Loading/Empty/Data states for map list */}
                 {isLoading ? (
                   <div className="space-y-0"> {Array(6).fill(0).map((_, i) => ( <div key={`map-skeleton-${i}`} className="p-3 border-b animate-pulse"> <div className="flex justify-between items-start mb-2"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-5 bg-muted-foreground/20 rounded w-20"></div> </div> <div className="space-y-3"> <div className="grid grid-cols-[16px_1fr] gap-1.5"> <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div> <div className="h-4 bg-muted-foreground/20 rounded w-28"></div> </div> <div className="grid grid-cols-[16px_1fr] gap-1.5"> <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div> <div className="h-4 bg-muted-foreground/20 rounded w-32"></div> </div> </div> <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40"> <div className="h-5 bg-muted-foreground/20 rounded w-16"></div> <div className="h-4 bg-muted-foreground/20 rounded w-14"></div> </div> </div> ))} </div>
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
            </div>
            
            {/* Map container */}
            <Card className="lg:col-span-3 h-[700px] p-0">
              <CardContent className="p-0 h-full">
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center h-full space-y-3"> <RefreshCw className="h-10 w-10 animate-spin text-primary/70" /> <p className="text-muted-foreground">Loading map and routes...</p> </div>
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
      
      {/* Modal Dialog for offer details (remains the same) */}
      {selectedOfferForModal && (
        <Dialog open={!!selectedOfferForModal} onOpenChange={(open) => !open && setSelectedOfferForModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Transport Offer {filteredOffers.find(o => o.id === selectedOfferForModal)?.id}
              </DialogTitle>
            </DialogHeader>
            <TransportOfferDetails 
              offer={filteredOffers.find(o => o.id === selectedOfferForModal) as TransportOffer} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 