"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, PlusCircle, Mail } from 'lucide-react';
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
import { toast } from 'sonner'; // Assuming toast notifications are set up
import { Id } from '../../../../../convex/_generated/dataModel';

// Placeholder function to initiate OAuth flow
const initiateOAuth = (provider: 'google' | 'outlook') => {
  // In a real app, this would likely redirect to a backend endpoint
  // like /startGoogleOAuth or /startOutlookOAuth which handles the Convex action call
  console.log(`Initiating OAuth for ${provider}...`);
  toast.info(`Connecting to ${provider}... (Redirect simulation)`);
  // Example redirect (replace with actual endpoint):
  // window.location.href = `/start${provider.charAt(0).toUpperCase() + provider.slice(1)}OAuth`;
};

export default function ConnectedAccountsPage() {
  const connections = useQuery(api.connections.listUserConnections);
  const deleteConnectionMutation = useMutation(api.connections.deleteConnection);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const isLoading = connections === undefined;

  const handleDelete = async (connectionId: string) => {
    setIsDeletingId(connectionId);
    try {
      const result = await deleteConnectionMutation({ connectionId: connectionId as Id<"connections"> });
      if (result.success) {
        toast.success("Connection removed successfully.");
      } else {
        toast.error("Failed to remove connection:", { description: result.error });
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("An error occurred while removing the connection.");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Connected Accounts</h1>
        <p className="text-muted-foreground">Manage email accounts used for sending and receiving negotiation messages.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Connections</CardTitle>
          <CardDescription>Connect your Gmail or Outlook accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            // Skeleton Loader
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
            // Display Connections
            connections.map((conn) => (
              <div key={conn._id} className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center gap-3">
                  {/* Basic Icon - enhance later */}
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
                      disabled={isDeletingId === conn._id}
                      title="Delete Connection"
                    >
                      {isDeletingId === conn._id ? (
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
                        onClick={() => handleDelete(conn._id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          ) : (
            // No Connections Yet
            <div className="text-center text-muted-foreground py-6">
              No email accounts connected yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 border-t pt-6">
          <Button variant="outline" onClick={() => initiateOAuth('google')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Connect Google
          </Button>
          <Button variant="outline" onClick={() => initiateOAuth('outlook')} disabled> {/* Disabled until implemented */} 
            <PlusCircle className="mr-2 h-4 w-4" /> Connect Outlook (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 