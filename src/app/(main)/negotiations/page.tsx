"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowDown,
  MessageSquare,
  Loader2,
  Pin,
  Trash2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { Id } from "../../../../convex/_generated/dataModel";
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

// Define interface for negotiation
interface Negotiation {
  id: string;
  offerId: string;
  offerRoute?: string;
  origin: string;
  destination: string;
  carrier?: string;
  initialPrice: string;
  currentPrice?: string;
  savings?: string | null;
  savingsPercentage?: string | null;
  status: "In Progress" | "Accepted" | "Rejected" | "Completed" | "Expired" | "pending";
  lastActivity?: string;
  dateCreated: string;
  messages: number;
  rounds?: number;
  loadingDate?: string;
  vehicle?: string;
  loadType?: string;
  aiAssistant?: boolean;
}

// Dummy data for demonstration - will be used as fallback when real data is not available
const dummyNegotiations: Negotiation[] = [
  {
    id: "NEG-4752",
    offerId: "TR-2587",
    offerRoute: "Warsaw, PL → Barcelona, ES",
    origin: "Warsaw, PL",
    destination: "Barcelona, ES",
    carrier: "SpeedFreight Ltd.",
    initialPrice: "€1,720",
    currentPrice: "€1,520",
    savings: "€200",
    savingsPercentage: "11.6%",
    status: "In Progress",
    lastActivity: "15 minutes ago",
    dateCreated: "Today, 14:40",
    messages: 8,
    rounds: 3,
    loadingDate: "2023-10-15",
    vehicle: "Standard Truck",
    loadType: "General Cargo",
    aiAssistant: true,
  },
  {
    id: "NEG-4751",
    offerId: "TR-2586",
    offerRoute: "Berlin, DE → Paris, FR",
    origin: "Berlin, DE",
    destination: "Paris, FR",
    carrier: "ExpressLogistics GmbH",
    initialPrice: "€980",
    currentPrice: "€890",
    savings: "€90",
    savingsPercentage: "9.2%",
    status: "Accepted",
    lastActivity: "2 hours ago",
    dateCreated: "Today, 12:30",
    messages: 6,
    rounds: 2,
    loadingDate: "2023-10-16",
    vehicle: "Standard Truck",
    loadType: "Palletized",
    aiAssistant: true,
  },
  {
    id: "NEG-4750",
    offerId: "TR-2585",
    offerRoute: "Munich, DE → Vienna, AT",
    origin: "Munich, DE",
    destination: "Vienna, AT",
    carrier: "AlpineTransport",
    initialPrice: "€590",
    currentPrice: "€520",
    savings: "€70",
    savingsPercentage: "11.9%",
    status: "Completed",
    lastActivity: "5 hours ago",
    dateCreated: "Today, 09:15",
    messages: 10,
    rounds: 4,
    loadingDate: "2023-10-15",
    vehicle: "Refrigerated Truck",
    loadType: "Temperature Controlled",
    aiAssistant: true,
  },
  {
    id: "NEG-4749",
    offerId: "TR-2584",
    offerRoute: "Amsterdam, NL → Milan, IT",
    origin: "Amsterdam, NL",
    destination: "Milan, IT",
    carrier: "EuroMovers B.V.",
    initialPrice: "€1,340",
    currentPrice: "€1,180",
    savings: "€160",
    savingsPercentage: "11.9%",
    status: "Completed",
    lastActivity: "Yesterday, 16:45",
    dateCreated: "Yesterday, 14:30",
    messages: 12,
    rounds: 5,
    loadingDate: "2023-10-14",
    vehicle: "Mega Trailer",
    loadType: "General Cargo",
    aiAssistant: true,
  },
  {
    id: "NEG-4748",
    offerId: "TR-2583",
    offerRoute: "Prague, CZ → Madrid, ES",
    origin: "Prague, CZ",
    destination: "Madrid, ES",
    carrier: "SpeedCargo",
    initialPrice: "€1,850",
    currentPrice: "€1,620",
    savings: "€230",
    savingsPercentage: "12.4%",
    status: "Completed",
    lastActivity: "Yesterday, 12:10",
    dateCreated: "2 days ago",
    messages: 8,
    rounds: 3,
    loadingDate: "2023-10-13",
    vehicle: "Standard Truck",
    loadType: "General Cargo",
    aiAssistant: true,
  },
  {
    id: "NEG-4747",
    offerId: "TR-2582",
    offerRoute: "Lyon, FR → Hamburg, DE",
    origin: "Lyon, FR",
    destination: "Hamburg, DE",
    carrier: "FreightMasters France",
    initialPrice: "€1,450",
    currentPrice: "€1,290",
    savings: "€160",
    savingsPercentage: "11.0%",
    status: "Rejected",
    lastActivity: "2 days ago",
    dateCreated: "3 days ago",
    messages: 4,
    rounds: 2,
    loadingDate: "2023-10-18",
    vehicle: "Box Truck",
    loadType: "Fragile Goods",
    aiAssistant: false,
  },
];

// Create a separate client component for the negotiation rows
function NegotiationRow({ neg, onDelete }: { neg: Negotiation; onDelete?: () => void }) {
  const { openNegotiation } = useNegotiationModal();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteNegotiation = useMutation(api.negotiations.deleteNegotiation);
  
  const handleRowClick = () => {
    router.push(`/negotiations/${neg.id}`);
  };
  
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    openNegotiation(neg.id as unknown as Id<"negotiations">);
  };
  
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent row click
    
    try {
      setIsDeleting(true);
      await deleteNegotiation({
        negotiationId: neg.id as unknown as Id<"negotiations">
      });
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting negotiation:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <tr 
      className="border-b hover:bg-muted/30 cursor-pointer transition-colors" 
      onClick={handleRowClick}
    >
      <td className="py-3 px-4 font-medium text-sm">{neg.id.substring(0, 8)}</td>
      <td className="py-3 px-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium">{neg.origin}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{neg.destination}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm">{neg.carrier || "Unknown"}</td>
      <td className="py-3 px-4 text-sm">{neg.initialPrice}</td>
      <td className="py-3 px-4 text-sm">{neg.currentPrice || neg.initialPrice}</td>
      <td className="py-3 px-4 text-sm">
        <div className="flex items-center">
          {neg.savings ? (
            <>
              <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">{neg.savings}</span>
              <span className="text-xs text-green-500 ml-1">({neg.savingsPercentage})</span>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-sm">
        <Badge 
          variant={
            neg.status === "In Progress" || neg.status === "pending" ? "secondary" :
            neg.status === "Accepted" ? "success" :
            neg.status === "Completed" ? "success" :
            neg.status === "Rejected" ? "destructive" :
            "outline"
          }
          className="font-normal"
        >
          {neg.status === "pending" ? "In Progress" : neg.status}
        </Badge>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {neg.lastActivity || formatDistanceToNow(new Date(neg.dateCreated), { addSuffix: true })}
      </td>
      <td className="py-3 px-4 text-sm">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{neg.messages}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenModal}
            className="h-7 w-7"
            title="Open as floating chat"
          >
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Delete negotiation"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Negotiation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this negotiation? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDelete(e)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

export default function NegotiationsPage() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch negotiations from Convex
  const convexNegotiations = useQuery(api.negotiations.getUserNegotiations);
  
  // Convert Convex negotiations to the UI format
  const formatNegotiations = (): Negotiation[] => {
    if (!convexNegotiations) {
      return dummyNegotiations; // Fallback to dummy data if fetching fails
    }
    
    return convexNegotiations.map(neg => {
      // Calculate the latest price (from the most recent counter offer, if any)
      const latestOffer = neg.counterOffers.length > 0 
        ? neg.counterOffers[neg.counterOffers.length - 1] 
        : null;
      
      const initialPrice = neg.initialRequest.price;
      const currentPrice = latestOffer ? latestOffer.price : initialPrice;
      
      // Calculate savings if there is a price difference
      const getNumericPrice = (price: string) => {
        return parseFloat(price.replace(/[^0-9.]/g, ""));
      };
      
      const initialNumeric = getNumericPrice(initialPrice);
      const currentNumeric = getNumericPrice(currentPrice);
      
      let savings = null;
      let savingsPercentage = null;
      
      if (initialNumeric > currentNumeric) {
        savings = `€${(initialNumeric - currentNumeric).toFixed(0)}`;
        savingsPercentage = `${((initialNumeric - currentNumeric) / initialNumeric * 100).toFixed(1)}%`;
      }
      
      return {
        id: neg._id.toString(),
        offerId: neg.offerId,
        origin: neg.initialRequest.origin,
        destination: neg.initialRequest.destination,
        carrier: neg.initialRequest.carrier,
        initialPrice: neg.initialRequest.price,
        currentPrice: latestOffer ? latestOffer.price : undefined,
        savings: savings,
        savingsPercentage: savingsPercentage,
        status: neg.status as any,
        dateCreated: new Date(neg.createdAt).toISOString(),
        messages: neg.messages.length,
        loadType: neg.initialRequest.loadType,
      };
    });
  };
  
  // Filter and sort the negotiations
  const getFilteredNegotiations = () => {
    const formatted = formatNegotiations();
    
    // Apply status filter
    let filtered = formatted;
    if (statusFilter !== "all") {
      filtered = filtered.filter(n => 
        statusFilter === "active" 
          ? (n.status === "In Progress" || n.status === "pending")
          : n.status === statusFilter
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.id.toLowerCase().includes(term) ||
        n.offerId.toLowerCase().includes(term) ||
        n.origin.toLowerCase().includes(term) ||
        n.destination.toLowerCase().includes(term) ||
        (n.carrier && n.carrier.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
      } else if (sortOrder === "highest") {
        return getNumericPrice(b.initialPrice) - getNumericPrice(a.initialPrice);
      } else if (sortOrder === "lowest") {
        return getNumericPrice(a.initialPrice) - getNumericPrice(b.initialPrice);
      }
      return 0;
    });
  };
  
  const getNumericPrice = (price: string) => {
    return parseFloat(price.replace(/[^0-9.]/g, ""));
  };
  
  const filteredNegotiations = getFilteredNegotiations();
  
  // Simple refresh function that adds a loading indicator
  const refreshNegotiations = () => {
    setIsRefreshing(true);
    // The actual refresh happens automatically via Convex's reactive queries
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  const isLoading = convexNegotiations === undefined;
  
  return (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Transport Negotiations</h1>
          <p className="text-muted-foreground">Manage and track all your freight price negotiations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={refreshNegotiations}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </Button>
          
          <Link href="/offers">
            <Button size="sm" className="gap-1">
              <span>New Negotiation</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, carrier..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  Newest First
                </SelectItem>
                <SelectItem value="oldest">
                  Oldest First
                </SelectItem>
                <SelectItem value="highest">
                  Highest Price
                </SelectItem>
                <SelectItem value="lowest">
                  Lowest Price
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/5">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading negotiations...</p>
        </div>
      ) : filteredNegotiations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/5">
          <h3 className="text-lg font-medium mb-2">No negotiations found</h3>
          <p className="text-muted-foreground mb-6">Start by requesting transport for an offer</p>
          <Link href="/offers">
            <Button>Find Transport Offers</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground font-medium">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Route</th>
                  <th className="text-left py-3 px-4">Carrier</th>
                  <th className="text-left py-3 px-4">Initial Price</th>
                  <th className="text-left py-3 px-4">Current Price</th>
                  <th className="text-left py-3 px-4">Savings</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Activity</th>
                  <th className="text-left py-3 px-4">Messages</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNegotiations.map((neg) => (
                  <NegotiationRow 
                    key={neg.id} 
                    neg={neg} 
                    onDelete={refreshNegotiations}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div>
              Showing {filteredNegotiations.length} of {filteredNegotiations.length} negotiations
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 