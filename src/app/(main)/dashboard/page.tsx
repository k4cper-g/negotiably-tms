"use client";

import { useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Euro, ListChecks, Clock, Search, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Id, Doc } from '../../../../convex/_generated/dataModel';

// Helper function to parse numeric value (assuming it exists or we redefine it)
const parseNumericValue = (str: string | null | undefined): number | null => {
  if (str === null || str === undefined) return null;
  try {
    // Improved cleaning: handle currency symbols, thousands separators (.), and decimal commas (,)
    const cleaned = str.replace(/[^\d,-]/g, '').replace(/,/g, '.'); // Standardize decimal point
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.warn(`Could not parse numeric value from: "${str}"`, error);
    return null;
  }
};

// Define Negotiation Status type if not imported
type NegotiationStatus = "In Progress" | "Accepted" | "Rejected" | "Completed" | "Expired" | "pending";

export default function DashboardPage() {
  const convexNegotiations = useQuery(api.negotiations.getUserNegotiations);
  const isLoadingNegotiations = convexNegotiations === undefined;
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  // Fetch current user only if authenticated, using "skip" string for conditional query
  const currentUser = useQuery(api.users.getCurrentUser, !isAuthenticated ? "skip" : undefined);
  const isLoadingUser = isAuthenticated && currentUser === undefined;

  // --- Calculate KPIs ---
  const kpis = useMemo(() => {
    if (isLoadingNegotiations || authLoading || isLoadingUser) {
      return {
        activeNegotiations: 0,
        totalSavings: 0,
        completedLast30Days: 0,
        averageSavingsPercentage: 0,
      };
    }

    let activeCount = 0;
    let totalSavings = 0;
    let completedCount = 0;
    let validSavingsCount = 0;
    let totalSavingsPercentage = 0;
    
    // Get current date for potential time-based filtering
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    // Process each negotiation
    convexNegotiations.forEach(neg => {
      const status = neg.status as NegotiationStatus;
      
      // Count active negotiations
      if (status === 'In Progress' || status === 'pending') {
        activeCount++;
      }
      
      // Calculate savings for completed negotiations
      if (status === 'Accepted' || status === 'Completed') {
        // Check if completed within the last 30 days
        const completedTimestamp = neg.updatedAt || neg.createdAt;
        const completionDate = new Date(completedTimestamp);
        
        // Add to completed count regardless of timestamp for total completed deals
        completedCount++;
        
        // Calculate savings
        const initialNumeric = parseNumericValue(neg.initialRequest.price);
        const currentNumeric = parseNumericValue(neg.currentPrice);

        if (initialNumeric !== null && currentNumeric !== null && initialNumeric > 0) {
          const difference = initialNumeric - currentNumeric;
          
          if (difference > 0) {
            // We achieved savings
            totalSavings += difference;
            const percentage = (difference / initialNumeric) * 100;
            totalSavingsPercentage += percentage;
            validSavingsCount++;
          }
          // Note: If difference <= 0, no savings were achieved (or negative savings)
        }
      }
    });

    const averageSavingsPercentage = validSavingsCount > 0 ? totalSavingsPercentage / validSavingsCount : 0;

    return {
      activeNegotiations: activeCount,
      totalSavings: Math.round(totalSavings * 100) / 100, // Round to 2 decimal places
      completedLast30Days: completedCount,
      averageSavingsPercentage: Math.round(averageSavingsPercentage * 10) / 10, // Round to 1 decimal place
    };
  }, [convexNegotiations, isLoadingNegotiations, authLoading, isLoadingUser]);

  // --- Get Recent Negotiations ---
  const recentNegotiations = useMemo(() => {
    if (isLoadingNegotiations || !convexNegotiations) {
      return [];
    }
    // Sort by last update time (most recent first)
    return [...convexNegotiations]
      .sort((a, b) => {
        const lastUpdateA = Math.max(a.updatedAt || 0, a.messages.length > 0 ? a.messages[a.messages.length - 1].timestamp : 0, a.counterOffers.length > 0 ? a.counterOffers[a.counterOffers.length - 1].timestamp : 0, a.createdAt);
        const lastUpdateB = Math.max(b.updatedAt || 0, b.messages.length > 0 ? b.messages[b.messages.length - 1].timestamp : 0, b.counterOffers.length > 0 ? b.counterOffers[b.counterOffers.length - 1].timestamp : 0, b.createdAt);
        return lastUpdateB - lastUpdateA;
      })
      .slice(0, 5); // Limit to 5 most recent
  }, [convexNegotiations, isLoadingNegotiations]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const getStatusBadgeVariant = (status: NegotiationStatus): "secondary" | "success" | "destructive" | "outline" | "default" => {
      switch (status) {
          case "In Progress":
          case "pending":
              return "secondary";
          case "Accepted":
          case "Completed":
              return "success";
          case "Rejected":
          case "Expired":
              return "destructive";
          default:
              return "outline";
      }
  };

  // Combined loading state for UI elements
  const isPageLoading = isLoadingNegotiations || authLoading || isLoadingUser;

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:py-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {authLoading || isLoadingUser
              ? <Skeleton className="h-8 w-32" />
              : currentUser
              ? `Hello ${currentUser.name}! 👋`
              : "Hi there"
            }
          </h1>
          <p className="text-muted-foreground">Track your negotiation progress and savings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/offers">
             <Button variant="outline" size="sm" className="gap-1.5">
                <Search className="h-4 w-4" />
                Find Offers
             </Button>
          </Link>
          <Link href="/negotiations">
             <Button size="sm" className="gap-1.5">
                <ListChecks className="h-4 w-4" />
                All Negotiations
             </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Negotiations</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{kpis.activeNegotiations}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
               <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalSavings)}</div>
                {kpis.totalSavings > 0 && (
                  <div className="flex items-center mt-1">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">Cost reduction achieved</p>
                  </div>
                )}
              </>
            )}
             <p className="text-xs text-muted-foreground pt-1">Cost reduction from initial prices</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Savings %</CardTitle>
             <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{kpis.averageSavingsPercentage.toFixed(1)}%</div>
            )}
             <p className="text-xs text-muted-foreground pt-1">Average price reduction per deal</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Deals</CardTitle>
             <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isPageLoading ? (
               <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{kpis.completedLast30Days}</div>
            )}
             <p className="text-xs text-muted-foreground pt-1">Accepted or completed negotiations</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Negotiations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your most recently updated negotiations.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingNegotiations ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
           ) : recentNegotiations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentNegotiations.map((neg) => {
                 const lastUpdate = Math.max(neg.updatedAt || 0, neg.messages.length > 0 ? neg.messages[neg.messages.length - 1].timestamp : 0, neg.counterOffers.length > 0 ? neg.counterOffers[neg.counterOffers.length - 1].timestamp : 0, neg.createdAt);
                 const status = neg.status as NegotiationStatus;
                 return (
                    <TableRow key={neg._id}>
                      <TableCell>
                        <div className="font-medium">{neg.initialRequest.origin}</div>
                        <div className="text-xs text-muted-foreground">to {neg.initialRequest.destination}</div>
                      </TableCell>
                      <TableCell>{neg.initialRequest.carrier || '-'}</TableCell>
                       <TableCell>
                         <Badge variant={getStatusBadgeVariant(status)} className="font-normal capitalize">
                            {status === 'pending' ? 'In Progress' : status}
                         </Badge>
                       </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/negotiations/${neg._id}`}>
                           <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                 );
                })}
            </TableBody>
          </Table>
           ) : (
             <div className="text-center py-10">
                <p className="text-muted-foreground">No recent negotiation activity.</p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}