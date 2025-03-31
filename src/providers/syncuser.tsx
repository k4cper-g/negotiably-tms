'use client'

import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '../../convex/_generated/api';


export const SyncUserWithConvex = () => {
  const { user, isLoaded } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // Once Clerk's user info is loaded, sync it with Convex.
    if (isLoaded && user && !hasSynced) {
      syncUserMutation({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || '',
        imageUrl: user.imageUrl || '',
      })
      .then(() => {
        setHasSynced(true);
      })
      .catch(err => {
        console.error("Error syncing user with Convex:", err);
      });
    }
  }, [isLoaded, user, syncUserMutation, hasSynced]);

  // This component doesn't render anything visible.
  return null;
};

export default SyncUserWithConvex;