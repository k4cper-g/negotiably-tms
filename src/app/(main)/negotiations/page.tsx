"use client";

import { useState, useEffect } from "react";
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
import { Id, Doc } from "../../../../convex/_generated/dataModel";
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

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

// Define the NegotiationStatus type
type NegotiationStatus = "In Progress" | "Accepted" | "Rejected" | "Completed" | "Expired" | "pending";

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
            neg.savings.startsWith('-') ? (
              // Negative savings (price increased)
              <>
                <span className="text-red-600 font-medium">{neg.savings}</span>
                {neg.savingsPercentage && (
                  <span className="text-xs text-red-500 ml-1">({neg.savingsPercentage})</span>
                )}
              </>
            ) : neg.savings === "€0.00" ? (
              // No change
              <span className="text-muted-foreground">{neg.savings}</span>
            ) : (
              // Positive savings (price decreased)
              <>
                <span className="text-green-600 font-medium">{neg.savings}</span>
                {neg.savingsPercentage && (
                  <span className="text-xs text-green-500 ml-1">({neg.savingsPercentage})</span>
                )}
              </>
            )
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
                  className="bg-black text-white hover:bg-black/80 cursor-pointer"
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

// --- Add Helper Function --- 
const parseNumericValue = (str: string | null | undefined): number | null => {
  if (str === null || str === undefined) return null;
  try {
    const cleaned = str.replace(/[^\d.,]/g, '');
    const withoutCommas = cleaned.replace(/,/g, '');
    const value = parseFloat(withoutCommas);
    return isNaN(value) ? null : value;
  } catch (error) {
    // console.error(`Error parsing numeric value from string "${str}":`, error); // Optional logging
    return null;
  }
};
// --- End Helper Function ---

export default function NegotiationsPage() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch negotiations from Convex
  const convexNegotiations = useQuery(api.negotiations.getUserNegotiations);
  
  // Helper to get numeric price
  const getNumericPrice = (price: string | null | undefined): number => {
    if (!price) return NaN;
    const parsed = parseNumericValue(price);
    return parsed === null ? NaN : parsed;
  };
  
  // Format negotiations data from Convex
  const formatNegotiations = (): Negotiation[] => {
    if (!convexNegotiations) return [];

    return convexNegotiations.map(neg => {
      const initialPriceStr = neg.initialRequest.price;
      const currentPriceStr = neg.currentPrice; // Use database field directly (string | undefined)
      
      let savings: string | null = null;
      let savingsPercentage: string | null = null;
      
      // --- Calculate savings based on CURRENT price (if available) --- 
      const initialNumeric = getNumericPrice(initialPriceStr);
      const currentNumeric = getNumericPrice(currentPriceStr); // Use current price string
        
      // If we have both numeric values, calculate the difference
      if (!isNaN(initialNumeric) && !isNaN(currentNumeric)) {
        const difference = initialNumeric - currentNumeric;
        
        if (difference > 0) {
          // Positive difference means price went down (savings)
          savings = `€${difference.toFixed(2)}`;
          savingsPercentage = `${((difference / initialNumeric) * 100).toFixed(1)}%`;
        } else if (difference < 0) {
          // Negative difference means price went up (increased cost)
          savings = `-€${Math.abs(difference).toFixed(2)}`;
          savingsPercentage = `-${(Math.abs(difference) / initialNumeric * 100).toFixed(1)}%`;
        } else {
          // No change in price
          savings = "€0.00";
          savingsPercentage = "0.0%";
        }
      }
      // --- End savings calculation block ---
      
      // Get last activity time
      const lastMessageTimestamp = neg.messages.length > 0 ? neg.messages[neg.messages.length - 1].timestamp : 0;
      const lastCounterOfferTimestamp = neg.counterOffers.length > 0 ? neg.counterOffers[neg.counterOffers.length - 1].timestamp : 0;
      const lastUpdateTime = Math.max(neg.updatedAt || 0, lastMessageTimestamp, lastCounterOfferTimestamp, neg.createdAt);
      const lastActivity = formatDistanceToNow(new Date(lastUpdateTime), { addSuffix: true });

      return {
        id: neg._id as string,
        offerId: neg.offerId as string,
        origin: neg.initialRequest.origin,
        destination: neg.initialRequest.destination,
        carrier: neg.initialRequest.carrier,
        initialPrice: initialPriceStr,
        currentPrice: currentPriceStr || initialPriceStr, // Display initial if current is undefined
        savings: savings,
        savingsPercentage: savingsPercentage,
        status: neg.status as NegotiationStatus,
        lastActivity: lastActivity,
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