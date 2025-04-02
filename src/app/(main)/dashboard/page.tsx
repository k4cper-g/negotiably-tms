"use client";

import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react"; // Example icon

// Define the type for the data returned by getRecentNegotiations
type RecentNegotiation = {
  _id: Id<"negotiations">;
  origin: string;
  destination: string;
  status: string;
  updatedAt: number;
};

// Helper to format currency (adjust locale and currency as needed)
const formatCurrency = (value: number | undefined | null) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

// Helper to format percentage
const formatPercentage = (value: number | undefined | null) => {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)}%`;
};

// Helper to format date/time (adjust options as needed)
const formatDateTime = (timestamp: number | undefined | null) => {
    if (!timestamp) return "-";
    try {
        const date = new Date(Number(timestamp)); 
        if (isNaN(date.getTime())) {
             throw new Error("Invalid timestamp value");
        }
        return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
    } catch (e) {
        console.error("Error formatting timestamp:", timestamp, e);
        try {
            return new Date(Number(timestamp)).toLocaleString('de-DE');
        } catch (finalError) {
            return "Invalid Date";
        }
    }
};

const DashboardPage = () => {
  const dashboardStats = useQuery(api.dashboard.getDashboardStats);
  const recentNegotiations = useQuery(api.dashboard.getRecentNegotiations, { limit: 5 });

  const isLoadingStats = dashboardStats === undefined;
  const isLoadingRecent = recentNegotiations === undefined;

  // Handling potential errors (simple example)
  // You might want more specific error handling based on Convex error types
  if (dashboardStats === null || recentNegotiations === null) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Key Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Negotiations</CardTitle>
            {/* Potential Icon Here */}
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{dashboardStats?.totalNegotiations ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Negotiations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{dashboardStats?.activeNegotiations ?? 0}</div>
            )}
             {/* Optional: Add description like "+X% from last month" if you track history */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats?.totalSavings)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatPercentage(dashboardStats?.successRate)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Status Breakdown - could be another Card or component */}
       <Card>
        <CardHeader>
            <CardTitle className="text-sm font-medium">Negotiation Status</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoadingStats ? (
                <Skeleton className="h-10 w-full" />
            ) : (
                <div className="flex justify-around text-center">
                    {/* Improve this display - maybe small cards or a chart */}
                    <div><p className="text-xs text-muted-foreground">Pending</p><p className="font-semibold">{dashboardStats?.pendingNegotiations ?? 0}</p></div>
                    <div><p className="text-xs text-muted-foreground">Active</p><p className="font-semibold">{dashboardStats?.activeNegotiations ?? 0}</p></div>
                    <div><p className="text-xs text-muted-foreground">Accepted</p><p className="font-semibold">{dashboardStats?.acceptedNegotiations ?? 0}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rejected/Cancelled</p><p className="font-semibold">{dashboardStats?.rejectedNegotiations ?? 0}</p></div>
                </div>
            )}
        </CardContent>
       </Card>

      {/* Recent Negotiations Table */}
      <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest negotiation updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRecent ? (
                  // Show Skeleton rows while loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skel-${index}`}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : recentNegotiations && recentNegotiations.length > 0 ? (
                  recentNegotiations.map((neg: RecentNegotiation) => (
                    <TableRow key={neg._id as string}>
                      <TableCell className="font-medium">{neg.origin}</TableCell>
                      <TableCell>{neg.destination}</TableCell>
                      <TableCell>{neg.status}</TableCell> {/* Consider adding status badges here */}
                      <TableCell className="text-right">{formatDateTime(neg.updatedAt)}</TableCell>
                       {/* TODO: Make row clickable/link to negotiation details */}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No recent negotiations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
};

export default DashboardPage;