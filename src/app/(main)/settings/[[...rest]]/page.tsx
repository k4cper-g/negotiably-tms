"use client";

import React, { useState } from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Trash2, Mail, Radio, Sun, Moon, Laptop, Check, Settings2, PlusCircle } from 'lucide-react';
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Skeleton } from "@/components/ui/skeleton";
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
import Link from 'next/link';

const AVAILABLE_BACKGROUNDS = [
  { name: 'Default', value: 'default', className: 'bg-muted/40' },
  { name: 'Subtle Dots', value: 'dots', className: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-neutral-950 dark:bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] dark:[background-size:16px_16px]' },
  { name: 'Soft Gradient', value: 'gradient', className: 'bg-white bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)] dark:bg-neutral-950 dark:bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.1)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)]' },
];

const SettingsPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [currentSection, setCurrentSection] = useState('profile');
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [chatBackground, setChatBackground] = useLocalStorage<string>('chatBackground', 'default');

  const connections = useQuery(api.connections.listUserConnections);
  const deleteConnectionMutation = useMutation(api.connections.deleteConnection);
  const generateStateMutation = useMutation(api.connections.generateOAuthState);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [isConnectingProvider, setIsConnectingProvider] = useState<string | null>(null);
  const connectionsLoading = connections === undefined;

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingId(connectionId);
    try {
      const result = await deleteConnectionMutation({ connectionId: connectionId as Id<"connections"> });
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
        // TODO: Implement Outlook connection
        throw new Error("Microsoft connection not yet implemented.");
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Ensure URL has no trailing slash before adding path
      const baseUrl = convexHttpActionUrl.endsWith('/') ? convexHttpActionUrl.slice(0, -1) : convexHttpActionUrl;
      const redirectUrl = `${baseUrl}${actionPath}?state=${encodeURIComponent(stateValue)}`;
      console.log(`Redirecting to: ${redirectUrl}`);
      window.location.href = redirectUrl;

    } catch (error: any) {
      console.error(`Error starting connection process for ${provider}:`, error);
      toast.error(error.message || `Failed to start ${provider} connection.`);
      setIsConnectingProvider(null);
    }
    // Keep loading state until redirect happens
    // setIsConnectingProvider(null); // Don't reset here
  };
  
  const isLoading = !isLoaded || (isSignedIn && !user);

  const getNavLinkClass = (section: string) => {
    return `font-semibold cursor-pointer ${currentSection === section ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`;
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6 md:px-6 lg:py-6 lg:px-8 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] gap-6">
           <div className="flex flex-col gap-4">
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
           </div>
           <div>
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
           </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    // Should be handled by middleware, but good fallback
    return <div>Please sign in to view settings.</div>; 
  }

  return (
    <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] w-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
         <h1 className="text-3xl font-semibold">Settings</h1>
       </div>
       <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
         <nav className="grid gap-4 text-sm text-muted-foreground">
           <a onClick={() => setCurrentSection('profile')} className={getNavLinkClass('profile')}>Profile</a>
           <a onClick={() => setCurrentSection('connections')} className={getNavLinkClass('connections')}>Connections</a>
           <a onClick={() => setCurrentSection('appearance')} className={getNavLinkClass('appearance')}>Appearance</a>
           <a onClick={() => setCurrentSection('notifications')} className={getNavLinkClass('notifications')}>Notifications</a>
         </nav>

         <div className="grid gap-6">
           {currentSection === 'profile' && (
              <UserProfile 
                 path="/settings" 
                 routing="path"    
                 appearance={{ 
                   baseTheme: resolvedTheme === 'dark' ? dark : undefined,
                   elements: {
                     card: "shadow-none border-none bg-transparent", 
                     rootBox: "w-full",
                   }
                 }}
               />
           )}

           {currentSection === 'connections' && (
              <Card>
                 <CardHeader>
                   <CardTitle>Connections</CardTitle>
                   <CardDescription>
                     Connect your Gmail or Outlook accounts to send and receive messages directly within your negotiations.
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   {connectionsLoading ? (
                     [...Array(2)].map((_, i) => (
                       <div key={i} className="flex items-center justify-between p-4 border rounded-md animate-pulse">
                         <div className="flex items-center gap-3">
                           <Skeleton className="h-8 w-8 rounded-full" />
                           <div className="space-y-1">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-20" />
                           </div>
                         </div>
                         <Skeleton className="h-8 w-8 rounded-md" />
                       </div>
                     ))
                   ) : connections && connections.length > 0 ? (
                     connections.map((conn) => (
                       <div key={conn._id} className="flex items-center justify-between p-4 border rounded-md">
                         <div className="flex items-center gap-3">
                           <Mail className="h-5 w-5 text-muted-foreground" /> 
                           <div>
                             <div className="font-medium">{conn.label || conn.email}</div>
                             <div className="text-sm text-muted-foreground capitalize">{conn.provider} Account</div>
                           </div>
                         </div>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               variant="ghost"
                               size="icon"
                               className="text-destructive hover:bg-destructive/10 h-8 w-8"
                               disabled={disconnectingId === conn._id}
                               title="Delete Connection"
                             >
                               {disconnectingId === conn._id ? (
                                 <Skeleton className="h-4 w-4 rounded-full animate-spin" /> 
                               ) : (
                                 <Trash2 className="h-4 w-4" />
                               )}
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to remove the connection for <strong>{conn.label || conn.email}</strong>? 
                                 Negotiations currently using this connection will stop sending/receiving emails via this account.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction 
                                 className="bg-destructive hover:bg-destructive/80"
                                 onClick={() => handleDisconnect(conn._id)}
                               >
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </div>
                     ))
                   ) : (
                     <div className="text-center text-muted-foreground py-6">
                       No email accounts connected yet.
                     </div>
                   )}
                 </CardContent>
                 <CardFooter className="flex gap-2 border-t pt-6">
                   <Button 
                     variant="outline" 
                     onClick={() => handleConnect('google')}
                     disabled={isConnectingProvider === 'google' || !!disconnectingId}
                   >
                     {isConnectingProvider === 'google' ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <PlusCircle className="mr-2 h-4 w-4" />
                     )}
                     Connect Google
                   </Button>
                   <Button 
                     variant="outline" 
                     onClick={() => handleConnect('microsoft')}
                     disabled // Disabled until implemented
                   >
                     <PlusCircle className="mr-2 h-4 w-4" /> Connect Outlook (Coming Soon)
                   </Button>
                 </CardFooter>
               </Card>
           )}

           {/* Appearance Section */}
           {currentSection === 'appearance' && (
             <Card>
               <CardHeader>
                 <CardTitle>Appearance</CardTitle>
                 <CardDescription>
                   Customize the look and feel of the application.
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Theme Settings */}
                 <div>
                   <h3 className="text-lg font-medium mb-3">Theme</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                     {/* Light Theme Preview */}
                     <div className="flex flex-col items-center">
                       <div 
                         onClick={() => setTheme('light')}
                         className={cn("w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", theme === 'light' ? "border-primary" : "border-transparent hover:border-muted-foreground/30")}
                       >
                         <div className="space-y-2 rounded-sm bg-zinc-100 p-2">
                           <div className="space-y-2 rounded-md bg-white p-2 shadow-sm"><div className="h-2 w-4/5 rounded-lg bg-zinc-200" /><div className="h-2 w-full rounded-lg bg-zinc-200" /></div>
                           <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-zinc-200" /><div className="h-2 w-full rounded-lg bg-zinc-200" /></div>
                           <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-zinc-200" /><div className="h-2 w-full rounded-lg bg-zinc-200" /></div>
                         </div>
                       </div>
                       <span className="block w-full pt-2 text-center font-normal text-muted-foreground">Light</span>
                     </div>
                     {/* Dark Theme Preview */}
                     <div className="flex flex-col items-center">
                       <div 
                         onClick={() => setTheme('dark')}
                         className={cn("w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", theme === 'dark' ? "border-primary" : "border-transparent hover:border-muted-foreground/30")}
                       >
                          <div className="space-y-2 rounded-sm bg-gray-950 p-2">
                           <div className="space-y-2 rounded-md bg-zinc-800 p-2 shadow-sm"><div className="h-2 w-4/5 rounded-lg bg-zinc-700" /><div className="h-2 w-full rounded-lg bg-zinc-700" /></div>
                           <div className="flex items-center space-x-2 rounded-md bg-zinc-800 p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-zinc-700" /><div className="h-2 w-full rounded-lg bg-zinc-700" /></div>
                           <div className="flex items-center space-x-2 rounded-md bg-zinc-800 p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-zinc-700" /><div className="h-2 w-full rounded-lg bg-zinc-700" /></div>
                         </div>
                       </div>
                       <span className="block w-full pt-2 text-center font-normal text-muted-foreground">Dark</span>
                     </div>
                     {/* System Theme Preview */}
                     <div className="flex flex-col items-center">
                       <div 
                         onClick={() => setTheme("system")}
                         className={cn("w-full border-2 rounded-lg p-1 transition-colors cursor-pointer", theme === "system" ? "border-primary" : "border-transparent hover:border-muted-foreground/30")}
                       >
                         <div className="space-y-2 rounded-sm bg-gradient-to-r from-zinc-100 to-gray-950 p-2">
                          <div className="space-y-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm"><div className="h-2 w-4/5 rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" /><div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" /></div>
                          <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-gradient-to-r from-zinc-200 to-zinc-700" /><div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" /></div>
                          <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-zinc-800 p-2 shadow-sm"><div className="h-4 w-4 rounded-full bg-gradient-to-r from-zinc-200 to-zinc-700" /><div className="h-2 w-full rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-700" /></div>
                        </div>
                       </div>
                       <span className="block w-full pt-2 text-center font-normal text-muted-foreground">System</span>
                     </div>
                   </div>
                 </div>
                 {/* Chat Background Settings */}
                 <div>
                   <h3 className="text-lg font-medium mb-3">Chat Background</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {AVAILABLE_BACKGROUNDS.map((bg) => (
                       <button
                         key={bg.value}
                         onClick={() => setChatBackground(bg.value)}
                         className={cn("border rounded-lg p-2 aspect-video flex items-center justify-center text-center text-sm font-medium relative overflow-hidden", "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background", chatBackground === bg.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:border-primary/50', bg.className )}
                         aria-label={`Set chat background to ${bg.name}`}
                       >
                         <div className={cn("absolute inset-0 flex items-center justify-center p-1", resolvedTheme === 'dark' ? 'bg-black/60' : 'bg-white/70' )}>
                           <span className="text-foreground text-center">{bg.name}</span>
                         </div>
                         {chatBackground === bg.value && (
                           <Check className="absolute top-1.5 right-1.5 h-4 w-4 text-primary bg-background rounded-full p-0.5" />
                         )}
                       </button>
                     ))}
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Notifications Section (Placeholder) */}
           {currentSection === 'notifications' && (
             <Card>
               <CardHeader>
                 <CardTitle>Notifications</CardTitle>
                 <CardDescription>
                   Configure how you receive notifications from the application.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-muted-foreground">Notification settings coming soon...</p>
               </CardContent>
             </Card>
           )}
         </div>
       </div>
     </div>
  );
};

export default SettingsPage; 