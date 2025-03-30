'use client'

import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';


export const SyncUserWithConvex = () => {
  const { user, isLoaded } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);

  useEffect(() => {
    // Once Clerk's user info is loaded, sync it with Convex.
    if (isLoaded && user) {
      console.log(user)
      syncUserMutation({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || '',
        imageUrl: user.imageUrl || '',
      }).catch(err => {
        console.error("Error syncing user with Convex:", err);
      });
    }
  }, [isLoaded, user, syncUserMutation]);

  // This component doesn't render anything visible.
  return null;
};

export default SyncUserWithConvex;