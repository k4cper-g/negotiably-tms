'use client'

import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '../../convex/_generated/api';


export const SyncUserWithConvex = () => {
  const { user, isLoaded } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);
  const [hasSynced, setHasSynced] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Only proceed when Clerk's user info is loaded
    if (!isLoaded || !user || hasSynced) return;
    
    // Add a small delay to ensure Clerk auth is fully established
    const timer = setTimeout(() => {
      syncUserMutation({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || '',
        imageUrl: user.imageUrl || '',
      })
      .then(() => {
        setHasSynced(true);
        console.log("User successfully synced with Convex");
      })
      .catch(err => {
        console.error("Error syncing user with Convex:", err);
        // Implement retry logic (max 3 attempts)
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          // Don't mark as synced so the effect will run again
        } else {
          // After max retries, mark as synced to prevent infinite retries
          setHasSynced(true);
        }
      });
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [isLoaded, user, syncUserMutation, hasSynced, retryCount]);

  // This component doesn't render anything visible.
  return null;
};

export default SyncUserWithConvex;