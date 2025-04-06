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

// Dummy data for demonstration - UPDATED DATES relative to April 4, 2025
const transportOffers: TransportOffer[] = [
  {
    id: "TR-2587",
    origin: "Warsaw, PL",
    originCoords: "52.2297° N, 21.0122° E",
    destination: "Barcelona, ES",
    destinationCoords: "41.3874° N, 2.1686° E",
    distance: "2,350 km",
    price: "€1,720",
    pricePerKm: "€0.73/km",
    carrier: "SpeedFreight Ltd.",
    loadType: "General Cargo",
    vehicle: "Standard Truck",
    weight: "22 tons",
    dimensions: "13.6 x 2.45 x 2.7m",
    loadingDate: "2025-04-05", // Tomorrow
    deliveryDate: "2025-04-08", // 3 days later
    status: "Available",
    platform: "TimoCom",
    lastUpdated: "Today, 14:35",
    dateCreated: "Today, 13:20",
    description: "Full truck load. Standard loading/unloading. ADR not required.",
    contact: "+49 30 1234567",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.8,
  },
  {
    id: "TR-2586",
    origin: "Berlin, DE",
    originCoords: "52.5200° N, 13.4050° E",
    destination: "Paris, FR",
    destinationCoords: "48.8566° N, 2.3522° E",
    distance: "1,050 km",
    price: "€980",
    pricePerKm: "€0.93/km",
    carrier: "ExpressLogistics GmbH",
    loadType: "Palletized",
    vehicle: "Standard Truck",
    weight: "15 tons",
    dimensions: "13.6 x 2.45 x 2.7m",
    loadingDate: "2025-04-06", // Day after tomorrow
    deliveryDate: "2025-04-07", // Next day
    status: "Available",
    platform: "Trans.eu",
    lastUpdated: "Today, 12:20",
    dateCreated: "Today, 09:45",
    description: "33 Euro pallets. Tail lift required. No dangerous goods.",
    contact: "+49 40 9876543",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.6,
  },
  {
    id: "TR-2585",
    origin: "Munich, DE",
    originCoords: "48.1351° N, 11.5820° E",
    destination: "Vienna, AT",
    destinationCoords: "48.2082° N, 16.3738° E",
    distance: "355 km",
    price: "€590",
    pricePerKm: "€1.66/km",
    carrier: "AlpineTransport",
    loadType: "Temperature Controlled",
    vehicle: "Refrigerated Truck",
    weight: "8 tons",
    dimensions: "13.6 x 2.45 x 2.7m",
    loadingDate: "2025-04-04", // Today
    deliveryDate: "2025-04-04", // Today
    status: "Available",
    platform: "Freightos",
    lastUpdated: "Today, 10:15",
    dateCreated: "Yesterday, 18:30",
    description: "Temperature-controlled transport (2-8°C). Pharmaceutical products.",
    contact: "+43 1 2345678",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.9,
  },
  {
    id: "TR-2584",
    origin: "Amsterdam, NL",
    originCoords: "52.3676° N, 4.9041° E",
    destination: "Milan, IT",
    destinationCoords: "45.4642° N, 9.1900° E",
    distance: "1,120 km",
    price: "€1,340",
    pricePerKm: "€1.20/km",
    carrier: "EuroMovers B.V.",
    loadType: "General Cargo",
    vehicle: "Mega Trailer",
    weight: "24 tons",
    dimensions: "13.6 x 2.45 x 3.0m",
    loadingDate: "2025-04-07", // 3 days from now
    deliveryDate: "2025-04-09", // 2 days later
    status: "Available",
    platform: "TimoCom",
    lastUpdated: "Yesterday, 16:40",
    dateCreated: "Yesterday, 12:15",
    description: "Mixed cargo. High-value goods. Extra security required.",
    contact: "+31 20 1234567",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.5,
  },
  {
    id: "TR-2583",
    origin: "Prague, CZ",
    originCoords: "50.0755° N, 14.4378° E",
    destination: "Madrid, ES",
    destinationCoords: "40.4168° N, 3.7038° W",
    distance: "2,200 km",
    price: "€1,850",
    pricePerKm: "€0.84/km",
    carrier: "SpeedCargo",
    loadType: "General Cargo",
    vehicle: "Standard Truck",
    weight: "22 tons",
    dimensions: "13.6 x 2.45 x 2.7m",
    loadingDate: "2025-04-10", // 6 days from now (outside 5-day forecast)
    deliveryDate: "2025-04-13", // 3 days later
    status: "Available",
    platform: "Trans.eu",
    lastUpdated: "Yesterday, 14:10",
    dateCreated: "2 days ago",
    description: "General cargo, no special requirements. Loading dock available.",
    contact: "+420 2 3456789",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.4,
  },
  {
    id: "TR-2582",
    origin: "Lyon, FR",
    originCoords: "45.7640° N, 4.8357° E",
    destination: "Hamburg, DE", 
    destinationCoords: "53.5511° N, 9.9937° E",
    distance: "1,350 km",
    price: "€1,450", 
    pricePerKm: "€1.07/km",
    carrier: "FreightMasters France",
    loadType: "Fragile Goods",
    vehicle: "Box Truck",
    weight: "12 tons",
    dimensions: "13.6 x 2.45 x 2.7m",
    loadingDate: "2025-04-08", // 4 days from now
    deliveryDate: "2025-04-10", // 2 days later (edge of 5-day forecast for loading, outside for delivery)
    status: "Available",
    platform: "Freightos",
    lastUpdated: "2 days ago",
    dateCreated: "3 days ago",
    description: "Fragile goods, handle with care. Special packaging provided.",
    contact: "+33 1 2345678",
    offerContactEmail: "alteriontech@gmail.com",
    rating: 4.7,
  },
];

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

export default function OffersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loadTypeFilter, setLoadTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [maxResults, setMaxResults] = useState("50");
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [selectedOfferForModal, setSelectedOfferForModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNegotiation, setIsCreatingNegotiation] = useState(false);
  const [loadingSource, setLoadingSource] = useState<'initial' | 'refresh' | 'ai' | null>(null);
  const createNegotiation = useMutation(api.negotiations.createNegotiation);
  const { openNegotiation } = useNegotiationModal();
  const router = useRouter();
  
  const [filteredOffers, setFilteredOffers] = useState<TransportOffer[]>(transportOffers);
  const [negotiationIdMap, setNegotiationIdMap] = useState<Record<string, Id<"negotiations">>>({});
  const [aiEvaluationResults, setAiEvaluationResults] = useState<Record<string, AiEvaluationResult>>({});

  // --- State for AI Tool Preferences ---
  const [useWeatherTool, setUseWeatherTool] = useState(true);
  const [useRouteTool, setUseRouteTool] = useState(true);
  const [useTollsTool, setUseTollsTool] = useState(true);
  // -------------------------------------

  // Get the Convex action handler
  const evaluateOffersAction = useAction(api.offers.evaluateOffers);

  // Initial load of offers
  useEffect(() => {
    // Pass 'initial' source on first load
    loadOffers('initial'); 
  }, []);

  // Scroll to map when map view is selected
  useEffect(() => {
    if (activeTab === "map" && mapContainerRef.current) {
      setTimeout(() => {
        mapContainerRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
    }
  }, [activeTab]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleOriginChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOriginFilter(e.target.value);
  };
  
  const handleDestinationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDestinationFilter(e.target.value);
  };
  
  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value);
  };
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };
  
  const handleMinPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMinPrice(e.target.value);
  };
  
  const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value);
  };
  
  const handleLoadTypeChange = (value: string) => {
    setLoadTypeFilter(value);
  };
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };
  
  const handleMaxResultsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMaxResults(e.target.value);
  };
  
  // Function to load offers with loading state
  const loadOffers = (source: 'initial' | 'refresh' = 'refresh') => {
    setIsLoading(true);
    setLoadingSource(source);
    setAiEvaluationResults({}); // Clear AI results on refresh
    
    // Keep the current data visible while loading new data
    // Instead of clearing filteredOffers, we'll just show loading indicators
    
    // Simulate API request delay
    setTimeout(() => {
      setFilteredOffers(transportOffers);
      setIsLoading(false);
    }, 1000);
    
    // When integrating with a real API, replace the above with:
    // fetch('/api/offers')
    //   .then(res => res.json())
    //   .then(data => {
    //     setFilteredOffers(data);
    //     setIsLoading(false);
    //   })
    //   .catch(err => {
    //     console.error('Error loading offers:', err);
    //     setIsLoading(false);
    //     setLoadingSource(null); // Also clear source on error
    //   });
  };

  const applyFilters = () => {
    setIsLoading(true);
    setAiEvaluationResults({}); // Clear AI results when applying standard filters
    
    // Keep the current data visible while loading new filtered data
    // This prevents layout shifts during filtering
    
    setTimeout(() => {
      // Move filtering logic here
      let filtered = transportOffers;
      
      // Apply search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(offer => 
          offer.id.toLowerCase().includes(term) || 
          offer.origin.toLowerCase().includes(term) || 
          offer.destination.toLowerCase().includes(term) || 
          offer.carrier.toLowerCase().includes(term)
        );
      }
      
      // Apply origin filter
      if (originFilter) {
        filtered = filtered.filter(offer => 
          offer.origin.toLowerCase().includes(originFilter.toLowerCase())
        );
      }
      
      // Apply destination filter
      if (destinationFilter) {
        filtered = filtered.filter(offer => 
          offer.destination.toLowerCase().includes(destinationFilter.toLowerCase())
        );
      }
      
      // Apply platform filter
      if (platformFilter && platformFilter !== "all") {
        filtered = filtered.filter(offer => 
          offer.platform === platformFilter
        );
      }
      
      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter(offer => 
          offer.status === statusFilter
        );
      }
      
      // Apply price range filters
      if (minPrice) {
        const min = parseInt(minPrice);
        filtered = filtered.filter(offer => {
          const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
          return price >= min;
        });
      }
      
      if (maxPrice) {
        const max = parseInt(maxPrice);
        filtered = filtered.filter(offer => {
          const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
          return price <= max;
        });
      }
      
      // Apply load type filter
      if (loadTypeFilter && loadTypeFilter !== "all") {
        filtered = filtered.filter(offer => 
          offer.loadType === loadTypeFilter
        );
      }
      
      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case "price-low":
            filtered.sort((a, b) => {
              const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
              const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
              return priceA - priceB;
            });
            break;
          case "price-high":
            filtered.sort((a, b) => {
              const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
              const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
              return priceB - priceA;
            });
            break;
          case "distance-low":
            filtered.sort((a, b) => {
              const distanceA = parseInt(a.distance.replace(/[^0-9]/g, ''));
              const distanceB = parseInt(b.distance.replace(/[^0-9]/g, ''));
              return distanceA - distanceB;
            });
            break;
          case "date":
            filtered.sort((a, b) => {
              return new Date(a.loadingDate).getTime() - new Date(b.loadingDate).getTime();
            });
            break;
          case "recent":
          default:
            // Assume more recent items are at the top already (based on ID)
            break;
        }
      }
      
      // If max results is set, limit the number of offers shown
      if (maxResults && parseInt(maxResults) > 0) {
        filtered = filtered.slice(0, parseInt(maxResults));
      }
      
      setFilteredOffers(filtered);

      // Build active filters array for display
      const newActiveFilters = [];
      
      if (platformFilter && platformFilter !== "all") {
        newActiveFilters.push({ type: 'platform', value: platformFilter });
      }
      
      if (statusFilter && statusFilter !== "all") {
        newActiveFilters.push({ type: 'status', value: statusFilter });
      }
      
      if (minPrice || maxPrice) {
        const priceRange = `€${minPrice || '0'} - €${maxPrice || '∞'}`;
        newActiveFilters.push({ type: 'price', value: priceRange });
      }
      
      if (loadTypeFilter && loadTypeFilter !== "all") {
        newActiveFilters.push({ type: 'loadType', value: loadTypeFilter });
      }
      
      setActiveFilters(newActiveFilters);
      setIsLoading(false);
    }, 800);
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setOriginFilter("");
    setDestinationFilter("");
    setPlatformFilter("");
    setStatusFilter("");
    setMinPrice("");
    setMaxPrice("");
    setLoadTypeFilter("");
    setSortBy("recent");
    setActiveFilters([]);
  };
  
  const removeFilter = (index: number) => {
    const filter = activeFilters[index];
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    
    // Reset the corresponding filter state
    switch (filter.type) {
      case 'platform':
        setPlatformFilter("");
        break;
      case 'status':
        setStatusFilter("");
        break;
      case 'price':
        setMinPrice("");
        setMaxPrice("");
        break;
      case 'loadType':
        setLoadTypeFilter("");
        break;
    }
    
    setActiveFilters(newFilters);
  };

  const handleOpenOfferDetails = (offerId: string) => {
    setSelectedOfferForModal(offerId);
  };

  // Updated function for AI Search - now includes filtering and uses isLoading
  const handleAiSearchClick = async () => {
    // Set main loading state to true to show skeletons
    setIsLoading(true);
    setLoadingSource('ai');
    setAiEvaluationResults({}); // Clear previous results

    // --- Filtering Logic (copied from applyFilters, without setTimeout/setIsLoading) ---
    let offersToEvaluate = [...transportOffers]; // Start with the original full list
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.id.toLowerCase().includes(term) || 
        offer.origin.toLowerCase().includes(term) || 
        offer.destination.toLowerCase().includes(term) || 
        offer.carrier.toLowerCase().includes(term)
      );
    }
    
    // Apply origin filter
    if (originFilter) {
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.origin.toLowerCase().includes(originFilter.toLowerCase())
      );
    }
    
    // Apply destination filter
    if (destinationFilter) {
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }
    
    // Apply platform filter
    if (platformFilter && platformFilter !== "all") {
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.platform === platformFilter
      );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.status === statusFilter
      );
    }
    
    // Apply price range filters
    if (minPrice) {
      const min = parseInt(minPrice);
      if (!isNaN(min)) {
        offersToEvaluate = offersToEvaluate.filter(offer => {
          const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
          return !isNaN(price) && price >= min;
        });
      }
    }
    
    if (maxPrice) {
      const max = parseInt(maxPrice);
      if (!isNaN(max)) {
        offersToEvaluate = offersToEvaluate.filter(offer => {
          const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
          return !isNaN(price) && price <= max;
        });
      }
    }
    
    // Apply load type filter
    if (loadTypeFilter && loadTypeFilter !== "all") {
      offersToEvaluate = offersToEvaluate.filter(offer => 
        offer.loadType === loadTypeFilter
      );
    }
    
    // Apply sorting (important for consistency if AI considers order)
    if (sortBy) {
      switch (sortBy) {
        case "price-low":
          offersToEvaluate.sort((a, b) => {
            const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
            const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
            return (isNaN(priceA) ? Infinity : priceA) - (isNaN(priceB) ? Infinity : priceB);
          });
          break;
        case "price-high":
          offersToEvaluate.sort((a, b) => {
            const priceA = parseInt(a.price.replace(/[^0-9]/g, ''));
            const priceB = parseInt(b.price.replace(/[^0-9]/g, ''));
            return (isNaN(priceB) ? -Infinity : priceB) - (isNaN(priceA) ? -Infinity : priceA);
          });
          break;
        case "distance-low":
          offersToEvaluate.sort((a, b) => {
            const distanceA = parseInt(a.distance.replace(/[^0-9]/g, ''));
            const distanceB = parseInt(b.distance.replace(/[^0-9]/g, ''));
            return (isNaN(distanceA) ? Infinity : distanceA) - (isNaN(distanceB) ? Infinity : distanceB);
          });
          break;
        case "date":
          offersToEvaluate.sort((a, b) => {
            const dateA = new Date(a.loadingDate).getTime();
            const dateB = new Date(b.loadingDate).getTime();
            return (isNaN(dateA) ? Infinity : dateA) - (isNaN(dateB) ? Infinity : dateB);
          });
          break;
        case "recent":
        default:
          // Assuming original transportOffers might have some inherent order or rely on ID
          break;
      }
    }
    
    // Apply max results limit AFTER filtering and sorting
    const currentMaxResults = parseInt(maxResults) || 50; // Default to 50 if invalid
    if (currentMaxResults > 0) {
      offersToEvaluate = offersToEvaluate.slice(0, currentMaxResults);
    }
    
    // Update the main displayed offers list
    setFilteredOffers(offersToEvaluate); 
    
    // Build active filters array for display (optional, but good for UX)
    const newActiveFilters = [];
    if (platformFilter && platformFilter !== "all") newActiveFilters.push({ type: 'platform', value: platformFilter });
    if (statusFilter && statusFilter !== "all") newActiveFilters.push({ type: 'status', value: statusFilter });
    if (minPrice || maxPrice) {
      const priceRange = `€${minPrice || '0'} - €${maxPrice || '∞'}`;
      newActiveFilters.push({ type: 'price', value: priceRange });
    }
    if (loadTypeFilter && loadTypeFilter !== "all") newActiveFilters.push({ type: 'loadType', value: loadTypeFilter });
    setActiveFilters(newActiveFilters);
    // --- End of Filtering Logic ---

    // Gather context for AI
    const searchContext = {
      filters: {
        searchTerm,
        originFilter,
        destinationFilter,
        platformFilter,
        statusFilter,
        minPrice,
        maxPrice,
        loadTypeFilter,
        sortBy,
        maxResults: offersToEvaluate.length,
      },
      offers: offersToEvaluate,
      useWeatherTool: useWeatherTool,
      useRouteTool: useRouteTool,
      useTollsTool: useTollsTool,
    };

    console.log(`Frontend: Filtered down to ${offersToEvaluate.length} offers. Calling evaluateOffers action with tool prefs: Weather=${useWeatherTool}, Route=${useRouteTool}, Tolls=${useTollsTool}.`);

    // Check if there are any offers left after filtering before calling AI
    if (offersToEvaluate.length === 0) {
      console.log("Frontend: No offers match criteria, skipping AI evaluation.");
      setIsLoading(false); // Stop loading state if skipping AI
      setLoadingSource(null);
      // Optionally show a message to the user
      // alert("No offers found matching your current filters.");
      return; // Exit the function
    }

    try {
      // Call the Convex action with the filtered list and NEW tool prefs
      const results = await evaluateOffersAction(searchContext);
      console.log("Frontend: Received evaluation results:", results);

      // --- Re-sort based on AI Ranking --- 
      const rankedResults = results as Record<string, AiEvaluationResult>;

      const finalSortedOffers = [...offersToEvaluate].sort((a, b) => {
        const rankA = rankedResults[a.id]?.rank;
        const rankB = rankedResults[b.id]?.rank;

        // Put ranked items before unranked items
        if (rankA !== undefined && rankB === undefined) return -1;
        if (rankA === undefined && rankB !== undefined) return 1;

        // Sort by rank ascending if both are ranked
        if (rankA !== undefined && rankB !== undefined) {
          return rankA - rankB;
        }

        // Otherwise, maintain original relative order (stable sort behavior)
        return 0; 
      });
      // --- End of Re-sorting ---

      // Update the displayed offers with the AI-ranked order
      setFilteredOffers(finalSortedOffers);

      // Now set the evaluation results for UI highlighting
      setAiEvaluationResults(rankedResults); 

    } catch (error) {
      console.error("Frontend: AI Search Error:", error);
      alert("AI evaluation failed. Please ensure the backend is running correctly and try again."); 
    } finally {
      setIsLoading(false);
      setLoadingSource(null);
    }
  };

  const handleRequestTransport = async (offer: TransportOffer) => {
    // Check if we already have a negotiation for this offer
    if (negotiationIdMap[offer.id]) {
      router.push(`/negotiations/${negotiationIdMap[offer.id]}`);
      return;
    }
    
    setIsCreatingNegotiation(true);
    try {
      const result = await createNegotiation({
        offerId: offer.id,
        initialRequest: {
          origin: offer.origin,
          destination: offer.destination,
          price: offer.price,
          loadType: offer.loadType,
          carrier: offer.carrier,
          weight: offer.weight,
          dimensions: offer.dimensions,
          notes: `Request for transport from ${offer.origin} to ${offer.destination}`,
        },
      });
      
      // Store the negotiation ID for this offer
      const negotiationId = result.negotiationId as Id<"negotiations">;
      setNegotiationIdMap(prev => ({
        ...prev,
        [offer.id]: negotiationId,
      }));
      
      // Navigate to the full negotiation page
      router.push(`/negotiations/${negotiationId}`);
    } catch (error) {
      console.error("Error creating negotiation:", error);
    } finally {
      setIsCreatingNegotiation(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transport Offers</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadOffers()} 
          disabled={isLoading}
          className="gap-2 h-9 px-3 min-w-[100px] flex items-center justify-center"
        >
          {/* Show spinner only if loading was triggered by Refresh */} 
          {isLoading && loadingSource === 'refresh' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            // Show icon and text when not loading
            <span className="inline-flex items-center"> 
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Refresh</span>
            </span>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              {/* Search, Origin, Destination */}
              <div className="space-y-1 md:col-span-4">
                <label className="text-sm font-medium leading-none">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="ID, route, carrier..." 
                    className="pl-8 h-9" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              <div className="space-y-1 md:col-span-4">
                <label className="text-sm font-medium leading-none">Origin</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Country or city..." 
                    className="pl-8 h-9" 
                    value={originFilter}
                    onChange={handleOriginChange}
                  />
                </div>
              </div>
              
              <div className="space-y-1 md:col-span-4">
                <label className="text-sm font-medium leading-none">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Country or city..." 
                    className="pl-8 h-9"
                    value={destinationFilter}
                    onChange={handleDestinationChange}
                  />
                </div>
              </div>
              
              {/* Platform, Status, Load Type, Price Range */}
              <div className="space-y-1 md:col-span-3">
                <label className="text-sm font-medium leading-none">Platform</label>
                <Select value={platformFilter} onValueChange={handlePlatformChange}>
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

              <div className="space-y-1 md:col-span-3">
                <label className="text-sm font-medium leading-none">Status</label>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
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
              
              <div className="space-y-1 md:col-span-3">
                <label className="text-sm font-medium leading-none">Load Type</label>
                <Select value={loadTypeFilter} onValueChange={handleLoadTypeChange}>
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
              <div className="space-y-1 md:col-span-3">
                <label className="text-sm font-medium leading-none">Price Range</label>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Min €"
                    className="h-9 w-full" 
                    value={minPrice}
                    onChange={handleMinPriceChange}
                  />
                  <span>-</span>
                  <Input 
                    placeholder="Max €" 
                    className="h-9 w-full"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 md:col-span-12 pt-4">
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    onClick={handleAiSearchClick}
                    disabled={isLoading}
                    className="h-9 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 relative overflow-hidden min-w-[110px] flex items-center justify-center gap-1.5"
                  >
                    {isLoading && loadingSource === 'ai' ? (
                      <Loader2 className="h-4 w-4 animate-spin" /> 
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> 
                        <span>AI Search</span>
                      </>
                    )}
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isLoading}>
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4">
                      <div className="space-y-4">
                        <p className="text-sm font-medium leading-none">AI Agent Tools</p>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="weather-tool"
                            checked={useWeatherTool}
                            onCheckedChange={(checked) => setUseWeatherTool(Boolean(checked))}
                          />
                          <Label htmlFor="weather-tool" className="text-sm font-normal cursor-pointer">
                            Weather Forecast
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="route-tool"
                            checked={useRouteTool}
                            onCheckedChange={(checked) => setUseRouteTool(Boolean(checked))}
                          />
                          <Label htmlFor="route-tool" className="text-sm font-normal cursor-pointer">
                            Optimal Route & Time
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="toll-tool"
                            checked={useTollsTool}
                            onCheckedChange={(checked) => setUseTollsTool(Boolean(checked))}
                          />
                          <Label htmlFor="toll-tool" className="text-sm font-normal cursor-pointer">
                            Toll Costs
                          </Label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="h-9">
                    Reset Filters
                  </Button>
                  <Button size="sm" onClick={applyFilters} className="h-9" disabled={isLoading && loadingSource !== 'ai'}>
                    <Search className="h-4 w-4 mr-1.5" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t mt-1">
                <span className="text-sm text-muted-foreground mr-1 pt-0.5">Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {filter.type === 'platform' ? 'Platform: ' : ''}
                    {filter.type === 'status' ? 'Status: ' : ''}
                    {filter.type === 'price' ? 'Price: ' : ''}
                    {filter.type === 'loadType' ? 'Type: ' : ''}
                    {filter.value}
                    <button
                      onClick={() => removeFilter(index)}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                      <span className="sr-only">Remove filter</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Modes */}
      <Tabs 
        defaultValue="list" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="list" className="cursor-pointer hover:bg-black/10  transition-all duration-300">List View</TabsTrigger>
            <TabsTrigger value="grid" className="cursor-pointer hover:bg-black/10  transition-all duration-300">Grid View</TabsTrigger>
            <TabsTrigger value="map" className="cursor-pointer hover:bg-black/10 transition-all duration-300">Map View</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium whitespace-nowrap">Sort By:</label>
              <div className="w-40">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Most recent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="distance-low">Distance: Low to High</SelectItem>
                    <SelectItem value="date">Loading Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium whitespace-nowrap">Max Results:</label>
              <Input 
                type="number"
                min="1"
                className="h-8 w-20"
                value={maxResults}
                onChange={handleMaxResultsChange}
                placeholder="50"
              />
            </div>
            
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {loadingSource === 'ai' ? 'Agent evaluating...' : 'Loading offers...'}
                </span>
              ) : (
                `Showing ${filteredOffers.length} offers`
              )}
            </div>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-md border overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium">ID</th>
                    <th className="py-3 px-4 text-left font-medium">Route</th>
                    <th className="py-3 px-4 text-left font-medium">Distance</th>
                    <th className="py-3 px-4 text-left font-medium">Price</th>
                    <th className="py-3 px-4 text-left font-medium">Vehicle</th>
                    <th className="py-3 px-4 text-left font-medium">Dates</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={`loading-${i}`} className="border-b animate-pulse">
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-16"></div></td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-28"></div>
                            <div className="h-4 bg-muted rounded w-28"></div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-16"></div></td>
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-16"></div></td>
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-24"></div></td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-4 bg-muted rounded w-24"></div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-20"></div></td>
                        <td className="py-3 px-4"><div className="h-5 bg-muted rounded w-16"></div></td>
                      </tr>
                    ))
                  ) : filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-muted-foreground">
                        No offers found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((offer) => {
                      const aiResult = aiEvaluationResults[offer.id]; // Get AI result for this offer
                      
                      // Define rank colors for table row
                      const getRowRankClass = (rank?: number) => {
                        switch (rank) {
                          case 1: return "bg-yellow-50 hover:bg-yellow-100/80"; // Gold
                          case 2: return "bg-gray-100 hover:bg-gray-200/80"; // Silver
                          case 3: return "bg-orange-50 hover:bg-orange-100/80"; // Bronze
                          default: return "hover:bg-muted/50";
                        }
                      };

                      return (
                        <Dialog key={offer.id}>
                          <DialogTrigger asChild>
                            {/* Add conditional background color and tooltip */} 
                            <tr key={offer.id} className={`border-b cursor-pointer transition-colors ${getRowRankClass(aiResult?.rank)}`}>
                              <td className="py-3 px-4 font-medium">
                                <div className="flex items-center gap-2">
                                  {offer.id}
                                  {aiResult && (
                                    <TooltipProvider>
                                      <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                          {/* Simple Award icon indicator */} 
                                          <Award 
                                            className={`h-4 w-4 
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
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                                    {offer.origin}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                    {offer.destination}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">{offer.distance}</td>
                              <td className="py-3 px-4 font-medium">{offer.price}</td>
                              <td className="py-3 px-4">{offer.vehicle}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">Load: {offer.loadingDate}</span>
                                  <span className="text-xs text-muted-foreground mt-1">Delivery: {offer.deliveryDate}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                  ${
                                    offer.status === "Available"
                                      ? "bg-green-100 text-green-800"
                                      : offer.status === "Pending"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-neutral-100 text-neutral-800"
                                  }
                                `}>
                                  {offer.status}
                                </div>
                              </td>
                              <td className="py-3 px-4">{offer.platform}</td>
                            </tr>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transport Offer {offer.id}</DialogTitle>
                            </DialogHeader>
                            <TransportOfferDetails offer={offer} />
                          </DialogContent>
                        </Dialog>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <div className="min-h-[600px]">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-1">
                {Array(8).fill(0).map((_, i) => (
                  <Card key={`skeleton-${i}`} className="h-full flex flex-col overflow-hidden animate-pulse">
                    <div className="bg-muted px-3 py-2 border-b flex items-center justify-between">
                      <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                    </div>
                    
                    <CardHeader className="pb-1 pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-28"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/20"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 py-0">
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
                        <div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-8 mb-1"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
                        </div>
                        <div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-12 mb-1"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-14"></div>
                        </div>
                        <div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-24"></div>
                        </div>
                        <div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-10 mb-1"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-24"></div>
                        </div>
                      </div>
                      
                      <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div>
                      
                      <div className="bg-muted/30 -mx-6 px-6 py-2 mt-auto border-t flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <div className="h-3 bg-muted-foreground/20 rounded w-14"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-3 bg-muted-foreground/20 rounded w-14"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <div className="p-3 border-t bg-background flex items-center justify-between gap-2">
                      <div className="h-8 bg-muted-foreground/20 rounded w-full"></div>
                    </div>
                  </Card>
                ))}
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
                    onSelect={(id) => handleOpenOfferDetails(id)} 
                    aiResult={aiEvaluationResults[offer.id]} // Pass AI result to OfferCard
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <div 
            ref={mapContainerRef}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[700px]"
          >
            {/* Offers list sidebar */}
            <div className="lg:col-span-1 border rounded-lg overflow-hidden shadow-sm bg-card h-[700px]">
              <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                <h3 className="font-medium">Available Routes</h3>
                <div className="text-xs text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    `${filteredOffers.length} offers`
                  )}
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(700px-48px)]">
                {isLoading ? (
                  <div className="space-y-0">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={`map-skeleton-${i}`} className="p-3 border-b animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
                          <div className="h-5 bg-muted-foreground/20 rounded w-20"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-[16px_1fr] gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div>
                            <div className="h-4 bg-muted-foreground/20 rounded w-28"></div>
                          </div>
                          <div className="grid grid-cols-[16px_1fr] gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 mt-1.5"></div>
                            <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                          <div className="h-5 bg-muted-foreground/20 rounded w-16"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-14"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No offers found</p>
                  </div>
                ) : (
                  filteredOffers.map((offer) => (
                    <div 
                      key={offer.id}
                      className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${selectedOffer === offer.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedOffer(selectedOffer === offer.id ? null : offer.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{offer.id}</div>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {offer.platform}
                        </Badge>
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
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <RefreshCw className="h-10 w-10 animate-spin text-primary/70" />
                    <p className="text-muted-foreground">Loading map and routes...</p>
                  </div>
                ) : (
                  <TransportMap 
                    offers={filteredOffers} 
                    selectedOfferId={selectedOffer} 
                    onRouteSelect={(offerId) => setSelectedOffer(selectedOffer === offerId ? null : offerId)} 
                    onOpenDetails={handleOpenOfferDetails}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal Dialog for offer details that can be triggered from map popups */}
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