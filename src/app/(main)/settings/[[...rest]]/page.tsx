"use client";

import React, { useState } from 'react';
// Remove Link import if no longer needed elsewhere
// import Link from 'next/link'; 
import { useUser, UserProfile } from '@clerk/nextjs'; // Import UserProfile
import { useQuery, useMutation } from "convex/react"; // Import Convex hooks
import { api } from "../../../../../convex/_generated/api"; // Import Convex API
import { Doc, Id } from "../../../../../convex/_generated/dataModel"; // Import Convex Id type
import { Button } from '@/components/ui/button'; // Keep Button for Connections
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Keep Separator for Connections
import { toast } from 'sonner';
import { Loader2, Trash2, Mail, Radio, Sun, Moon, Laptop } from 'lucide-react'; // Added icons and theme icons
import { useTheme } from "next-themes"; // Import useTheme hook
import { dark } from "@clerk/themes"; // Use the standard import path now that the package is installed
import { cn } from "@/lib/utils"; // Import cn utility
// Remove unused imports
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Loader2 } from 'lucide-react';

// Clerk User Profile URL is no longer needed here
// const CLERK_USER_PROFILE_URL = "...";

// Define supported providers and their display names/icons
const SUPPORTED_PROVIDERS = [
  {
    id: 'google',
    name: 'Gmail / Google',
    icon: Mail, // Replace with actual Gmail icon if available
    description: 'Connect your Google account.',
  },
  {
    id: 'microsoft',
    name: 'Outlook / Microsoft',
    icon: Radio, // Replace with actual Outlook icon if available
    description: 'Connect your Microsoft account.',
  },
];

const SettingsPage = () => {
  const [currentSection, setCurrentSection] = useState('connections'); // Default to connections
  const { setTheme, theme, resolvedTheme } = useTheme(); // Get theme state, setter, and resolvedTheme
  
  // Fetch connections
  const connections = useQuery(api.connections.listConnections);
  const connectionsLoading = connections === undefined;

  // Disconnect mutation
  const deleteConnectionMutation = useMutation(api.connections.deleteConnection);
  const generateStateMutation = useMutation(api.connections.generateOAuthState);
  const [disconnectingId, setDisconnectingId] = useState<Id<"connections"> | null>(null);
  const [isConnectingProvider, setIsConnectingProvider] = useState<string | null>(null);

  const handleDisconnect = async (connectionId: Id<"connections">) => {
    setDisconnectingId(connectionId);
    try {
      const result = await deleteConnectionMutation({ connectionId });
      if (result.success) {
        toast.success("Connection removed successfully!");
      } else {
        throw new Error(result.error || "Failed to remove connection.");
      }
    } catch (error: any) {
      console.error("Error disconnecting account:", error);
      toast.error(error.message || "Failed to remove connection. Please try again.");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleConnect = async (provider: string) => {
    setIsConnectingProvider(provider);
    try {
      const stateValue = await generateStateMutation({});
      if (!stateValue) {
        throw new Error("Failed to generate secure state for connection.");
      }
      console.log(`Generated state: ${stateValue}`);

      const convexHttpActionUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site");
      if (!convexHttpActionUrl) {
        throw new Error("Convex Site URL is not configured properly.");
      }

      let actionPath = '';
      if (provider === 'google') {
        actionPath = '/startGoogleOAuth';
      } else if (provider === 'microsoft') {
        throw new Error("Microsoft connection not yet implemented.");
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      const redirectUrl = `${convexHttpActionUrl}${actionPath}?state=${encodeURIComponent(stateValue)}`;
      console.log(`Redirecting to: ${redirectUrl}`);
      window.location.href = redirectUrl;

    } catch (error: any) {
      console.error(`Error starting connection process for ${provider}:`, error);
      toast.error(error.message || `Failed to start ${provider} connection.`);
      setIsConnectingProvider(null);
    }
  };

  const getNavLinkClass = (section: string) => {
    return `font-semibold cursor-pointer ${currentSection === section ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`;
  };

  // Remove handleProfileUpdate function
  // const handleProfileUpdate = async () => { ... };

  // Remove getUserInitials function
  // const getUserInitials = (name?: string | null) => { ... };

  // User details fetched by <UserProfile /> directly
  // const userPrimaryEmail = ...;
  // const userImageUrl = ...;
  // const userFullName = ...;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          {/* Sidebar Navigation (remains the same) */}
          <nav className="grid gap-4 text-sm">
            <a onClick={() => setCurrentSection('connections')} className={getNavLinkClass('connections')}>Connections</a>
            <a onClick={() => setCurrentSection('profile')} className={getNavLinkClass('profile')}>Profile</a>
            <a onClick={() => setCurrentSection('notifications')} className={getNavLinkClass('notifications')}>Notifications</a>
            <a onClick={() => setCurrentSection('theme')} className={getNavLinkClass('theme')}>Theme</a>
          </nav>

          <div className="grid gap-6">
            {/* Connections Section - Updated */}
            {currentSection === 'connections' && (
              <Card>
                <CardHeader>
                  <CardTitle>Connections</CardTitle>
                  <CardDescription>
                    Connect your email accounts to send and receive messages directly within your negotiations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Email Accounts</h3>
                      <Separator className="mb-4" />
                      {connectionsLoading && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {!connectionsLoading && connections && (
                        <div className="space-y-4">
                          {SUPPORTED_PROVIDERS.map((providerInfo) => {
                            const connection = connections.find((c: Doc<"connections">) => c.provider === providerInfo.id);
                            const isDisconnecting = disconnectingId === connection?._id;
                            const isConnecting = isConnectingProvider === providerInfo.id;
                            
                            return (
                              <div key={providerInfo.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <providerInfo.icon className="w-6 h-6 text-muted-foreground" /> 
                                  <div>
                                    <p className="font-medium">{providerInfo.name}</p>
                                    {connection ? (
                                      <p className="text-sm text-muted-foreground">Connected as: {connection.accountEmail}</p>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">{providerInfo.description}</p>
                                    )}
                                  </div>
                                </div>
                                {connection ? (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => handleDisconnect(connection._id)}
                                    disabled={isDisconnecting || isConnecting}
                                    aria-label={`Disconnect ${providerInfo.name}`}
                                  >
                                    {isDisconnecting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    )}
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    onClick={() => handleConnect(providerInfo.id)}
                                    disabled={isConnecting || isDisconnecting}
                                  >
                                    {isConnecting ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Connect
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!connectionsLoading && connections?.length === 0 && SUPPORTED_PROVIDERS.length === 0 && (
                         <p className="text-sm text-muted-foreground text-center py-4">No connection providers configured.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Section - Remove Card wrapper */}
            {currentSection === 'profile' && (
              <div> {/* Basic div wrapper is fine if needed for grid layout */}
                <UserProfile 
                  path="/settings" 
                  routing="path"    
                  appearance={{ 
                    baseTheme: resolvedTheme === 'dark' ? dark : undefined,
                    elements: {
                      // Keep these overrides so it blends
                      card: "shadow-none border-none bg-transparent", 
                      rootBox: "w-full",
                    }
                  }}
                />
              </div>
            )}

            {/* Notifications Section (remains the same) */}
            {currentSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications from the application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Notification settings content goes here...</p>
                </CardContent>
              </Card>
            )}

            {/* Theme Section - Updated UI */}
            {currentSection === 'theme' && (
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Select the theme for the application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {/* New Theme Preview Grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                       {/* Light Theme Preview */}
                       <div className="flex flex-col items-center">
                         <div // Add w-full to prevent horizontal squishing
                           onClick={() => setTheme('light')}
                           className={cn(
                             "w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", // Added w-full
                             theme === 'light' ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                           )}
                         >
                           <div className="space-y-2 rounded-sm bg-zinc-100 p-2"> 
                             <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                               <div className="h-2 w-4/5 rounded-lg bg-zinc-200" />
                               <div className="h-2 w-full rounded-lg bg-zinc-200" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-zinc-200" />
                               <div className="h-2 w-full rounded-lg bg-zinc-200" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-zinc-200" />
                               <div className="h-2 w-full rounded-lg bg-zinc-200" />
                             </div>
                           </div>
                         </div>
                         <span className="block w-full pt-2 text-center font-normal text-muted-foreground">Light</span> 
                       </div>

                       {/* Dark Theme Preview */}
                       <div className="flex flex-col items-center">
                         <div // Add w-full to prevent horizontal squishing
                           onClick={() => setTheme('dark')}
                           className={cn(
                             "w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", // Added w-full
                             theme === 'dark' ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                           )}
                         >
                           <div className="space-y-2 rounded-sm bg-gray-950 p-2">
                            <div className="space-y-2 rounded-md bg-zinc-800 p-2 shadow-sm">
                               <div className="h-2 w-4/5 rounded-lg bg-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-zinc-700" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-zinc-800 p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-zinc-700" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-zinc-800 p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-zinc-700" />
                             </div>
                           </div>
                         </div>
                         <span className="block w-full pt-2 text-center font-normal text-muted-foreground">Dark</span>
                       </div>
                       
                       {/* System Theme Preview */} 
                       <div className="flex flex-col items-center">
                         <div // Add w-full to prevent horizontal squishing
                           onClick={() => setTheme("system")}
                           className={cn(
                             "w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", // Added w-full
                             theme === "system"
                               ? "border-primary"
                               : "border-transparent hover:border-muted-foreground/30"
                           )}
                         >
                           <div className="space-y-2 rounded-sm bg-gradient-to-r from-zinc-100 to-gray-950 p-2">
                            <div className="space-y-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm">
                               <div className="h-2 w-4/5 rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-gradient-to-r from-zinc-200 to-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" />
                             </div>
                             <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm">
                               <div className="h-4 w-4 rounded-full bg-gradient-to-r from-zinc-200 to-zinc-700" />
                               <div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" />
                             </div>
                           </div>
                         </div>
                         <span className="block w-full pt-2 text-center font-normal text-muted-foreground">System</span>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage; 