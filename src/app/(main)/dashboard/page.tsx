"use client";

import { useMemo } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Euro, ListChecks, Clock, Search, PlusCircle, TrendingUp, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Id, Doc } from '../../../../convex/_generated/dataModel';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

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

// Function to generate mock profit timeline data (replace with real data later)
const generateProfitTimelineData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, index) => ({
    month,
    profit: Math.floor(Math.random() * 4000) + 1000, // Random values between 1000-5000
    isCurrentMonth: index === currentMonth
  }));
};

// Function to process negotiation data into monthly profit data
const processMonthlyProfitData = (negotiations: any[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Initialize monthly data with zero profit for each month
  const monthlyData = months.map((month, index) => ({
    month,
    profit: 0,
    isCurrentMonth: index === currentMonth
  }));
  
  // Process each negotiation
  negotiations.forEach(negotiation => {
    // Only consider accepted negotiations with profit data
    if (negotiation.status === 'accepted') {
      // Get the completion date of the negotiation
      const completionDate = new Date(negotiation.updatedAt || negotiation.createdAt);
      const completionMonth = completionDate.getMonth();
      const completionYear = completionDate.getFullYear();
      
      // Only include negotiations from current year
      if (completionYear === currentYear) {
        // Get profit value from the negotiation
        let profit = 0;
        
        // Use stored profit if available
        if (negotiation.profit !== undefined) {
          profit = negotiation.profit;
        } else {
          // Calculate profit from initial and current prices
          const initialPrice = parseNumericValue(negotiation.initialRequest.price) || 0;
          const currentPrice = parseNumericValue(negotiation.currentPrice || negotiation.initialRequest.price) || 0;
          profit = currentPrice - initialPrice; // Using the new profit calculation
        }
        
        // Add profit to the corresponding month
        monthlyData[completionMonth].profit += profit;
      }
    }
  });
  
  return monthlyData;
};

export default function DashboardPage() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  
  // Fetch dashboard stats from the updated backend API
  const dashboardStats = useQuery(api.dashboard.getDashboardStats);
  const isLoadingStats = dashboardStats === undefined;
  
  // Fetch negotiations for recent activity table
  const convexNegotiations = useQuery(api.negotiations.getUserNegotiations);
  const isLoadingNegotiations = convexNegotiations === undefined;
  
  // Fetch current user only if authenticated, using "skip" string for conditional query
  const currentUser = useQuery(api.users.getCurrentUser, !isAuthenticated ? "skip" : undefined);
  const isLoadingUser = isAuthenticated && currentUser === undefined;

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

  // Process real profit data from negotiations
  const profitTimelineData = useMemo(() => {
    if (isLoadingNegotiations || !convexNegotiations) {
      // Return empty data while loading
      return processMonthlyProfitData([]);
    }
    return processMonthlyProfitData(convexNegotiations);
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
  const isPageLoading = isLoadingNegotiations || authLoading || isLoadingUser || isLoadingStats;
  
  // Safe access to dashboard stats
  const stats = dashboardStats || {
    totalNegotiations: 0,
    activeNegotiations: 0,
    completedDeals: 0,
    rejectedNegotiations: 0,
    totalSavings: 0,
    averageSavings: 0,
    successRate: 0
  };

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
              <div className="text-2xl font-bold">{stats.activeNegotiations}</div>
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
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
                {stats.totalSavings > 0 && (
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
            <CardTitle className="text-sm font-medium">Avg. Savings</CardTitle>
             <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats.averageSavings)}</div>
            )}
             <p className="text-xs text-muted-foreground pt-1">Average per completed deal</p>
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
              <div className="text-2xl font-bold">{stats.completedDeals}</div>
            )}
             <p className="text-xs text-muted-foreground pt-1">Accepted negotiations</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Main Content - Two-Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Profit Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Timeline</CardTitle>
            <CardDescription>Monthly profit overview</CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <div className="h-80 w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitTimelineData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false}
                      tickMargin={10}
                    />
                    <Tooltip 
                      cursor={{fill: 'var(--accent)'}}
                      formatter={(value) => [formatCurrency(Number(value)), 'Profit']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar 
                      dataKey="profit" 
                      radius={[4, 4, 0, 0]}
                      fill="var(--primary)"
                      shape={(props: any) => {
                        const { x, y, width, height } = props;
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={props.payload.isCurrentMonth ? 'var(--primary)' : 'var(--muted)'}
                            rx={4}
                            ry={4}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {!isPageLoading && (
                <>
                  {/* Calculate if profit is trending up by comparing the last 2 months */}
                  {(() => {
                    const currentMonthIndex = new Date().getMonth();
                    const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
                    const currentMonthProfit = profitTimelineData[currentMonthIndex].profit;
                    const previousMonthProfit = profitTimelineData[previousMonthIndex].profit;
                    
                    // Calculate trend percentage if both months have data
                    if (previousMonthProfit !== 0) {
                      const trendPercentage = ((currentMonthProfit - previousMonthProfit) / Math.abs(previousMonthProfit)) * 100;
                      
                      if (trendPercentage > 0) {
                        return (
                          <>
                            <span>Trending up by {trendPercentage.toFixed(1)}% this month</span>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          </>
                        );
                      } else if (trendPercentage < 0) {
                        return (
                          <>
                            <span>Trending down by {Math.abs(trendPercentage).toFixed(1)}% this month</span>
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          </>
                        );
                      } else {
                        return <span>No change in profit this month</span>;
                      }
                    } else if (currentMonthProfit > 0) {
                      return (
                        <>
                          <span>First profits this month</span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </>
                      );
                    } else {
                      return <span>Profit overview for {new Date().getFullYear()}</span>;
                    }
                  })()}
                </>
              )}
            </div>
            <div className="leading-none text-muted-foreground">
              Showing profit distribution across months in {new Date().getFullYear()}
            </div>
          </CardFooter>
        </Card>

        {/* Right Column - Recent Negotiations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Negotiations</CardTitle>
            <CardDescription>You have {stats.totalNegotiations} negotiations total</CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentNegotiations.length > 0 ? (
              <div className="space-y-6">
                {recentNegotiations.map((neg) => {
                  // Calculate profit from negotiation
                  const initialPrice = parseNumericValue(neg.initialRequest.price) || 0;
                  const currentPrice = parseNumericValue(neg.currentPrice || neg.initialRequest.price) || 0;
                  const profit = neg.profit !== undefined ? neg.profit : (initialPrice - currentPrice);
                  const route = `${neg.initialRequest.origin} → ${neg.initialRequest.destination}`;
                  
                  return (
                    <div key={neg._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{route}</div>
                          <div className="text-sm text-muted-foreground">{neg.initialRequest.carrier || 'No carrier'}</div>
                        </div>
                      </div>
                      <div className={profit > 0 ? 'text-green-500 font-medium' : profit < 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                        {profit !== 0 ? (profit > 0 ? '+' : '') + formatCurrency(profit) : '€0.00'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No recent negotiation activity.</p>
              </div>
            )}
          </CardContent>
          {recentNegotiations.length > 0 && (
            <CardFooter>
              <Link href="/negotiations" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Negotiations
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}