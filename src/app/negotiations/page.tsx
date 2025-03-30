"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Filter,
  Clock,
  Search,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  BarChart,
  CheckCircle,
  XCircle,
  Loader2,
  Pin,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useNegotiationModal } from "@/context/NegotiationModalContext";
import { Id } from "../../../convex/_generated/dataModel";
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
      className="border-b hover:bg-muted/50 cursor-pointer w-full" 
      onClick={handleRowClick}
    >
      <td className="py-3 px-4 font-medium">{neg.id}</td>
      <td className="py-3 px-4">
        {neg.offerRoute || `${neg.origin} → ${neg.destination}`}
      </td>
      <td className="py-3 px-4">{neg.carrier || "Unknown"}</td>
      <td className="py-3 px-4">{neg.initialPrice}</td>
      <td className="py-3 px-4">{neg.currentPrice || neg.initialPrice}</td>
      <td className="py-3 px-4">
        <div className="flex items-center">
          {neg.savings ? (
            <>
              <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">{neg.savings}</span>
              <span className="text-sm text-muted-foreground ml-1">({neg.savingsPercentage})</span>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge 
          variant={
            neg.status === "In Progress" || neg.status === "pending" ? "outline" :
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
      <td className="py-3 px-4 text-muted-foreground">
        {neg.lastActivity || formatDistanceToNow(new Date(neg.dateCreated), { addSuffix: true })}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span>{neg.messages}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div 
            className="cursor-pointer" 
            title="Open as floating chat"
            onClick={handleOpenModal}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-muted-foreground hover:text-foreground"
            >
              <line x1="12" x2="12" y1="17" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div 
                className="cursor-pointer"
                title="Delete negotiation"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </div>
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
  
  // Loading state
  const isLoading = convexNegotiations === undefined;

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Add a refresh function to trigger refetching data
  const refreshNegotiations = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Use the refreshTrigger in your useEffect to reload data
  useEffect(() => {
    // This will run whenever refreshTrigger changes, forcing a re-fetch
  }, [refreshTrigger]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Transport Negotiations</h1>
        <p className="text-muted-foreground">Track and manage your transport negotiations</p>
      </header>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search negotiations..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Price</SelectItem>
              <SelectItem value="lowest">Lowest Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Link href="/offers">
          <Button className="w-full md:w-auto">
            Find Transport Offers
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading negotiations...</p>
        </div>
      ) : filteredNegotiations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-medium mb-2">No negotiations found</h3>
          <p className="text-muted-foreground mb-6">Start by requesting transport for an offer</p>
          <Link href="/offers">
            <Button>Find Transport Offers</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">ID</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Route</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Carrier</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Initial Price</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Current Price</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Savings</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Status</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Last Activity</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Messages</th>
                  <th className="text-left text-sm text-muted-foreground font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNegotiations.map((negotiation) => (
                  <NegotiationRow 
                    key={negotiation.id} 
                    neg={negotiation} 
                    onDelete={refreshNegotiations}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart2 className="h-5 w-5 text-primary" />
              Negotiation Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Active Negotiations</span>
                  <span className="font-medium">{filteredNegotiations.filter(n => n.status === "In Progress" || n.status === "pending").length}</span>
                </div>
                <Progress value={
                  (filteredNegotiations.filter(n => n.status === "In Progress" || n.status === "pending").length / 
                  filteredNegotiations.length) * 100
                } />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Successful Negotiations</span>
                  <span className="font-medium">{filteredNegotiations.filter(n => n.status === "Accepted" || n.status === "Completed").length}</span>
                </div>
                <Progress value={
                  (filteredNegotiations.filter(n => n.status === "Accepted" || n.status === "Completed").length / 
                  filteredNegotiations.length) * 100
                } />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Failed Negotiations</span>
                  <span className="font-medium">{filteredNegotiations.filter(n => n.status === "Rejected" || n.status === "Expired").length}</span>
                </div>
                <Progress value={
                  (filteredNegotiations.filter(n => n.status === "Rejected" || n.status === "Expired").length / 
                  filteredNegotiations.length) * 100
                } />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {
                    filteredNegotiations.length > 0
                      ? `${Math.round((filteredNegotiations.filter(n => n.status === "Accepted" || n.status === "Completed").length / filteredNegotiations.length) * 100)}%`
                      : "0%"
                  }
                </div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowDown className="h-5 w-5 text-primary" />
              Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  €{
                    filteredNegotiations
                      .filter(n => n.savings)
                      .reduce((acc, curr) => acc + getNumericPrice(curr.savings || "€0"), 0)
                      .toFixed(0)
                  }
                </div>
                <p className="text-sm text-muted-foreground">Total Amount Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 