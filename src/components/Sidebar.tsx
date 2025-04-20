"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Package, 
  FileText, 
  BarChart2, 
  Map,
  LogOut,
  Users,
  Bell,
  Shield,
  Settings,
  Truck,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { clerkClient } from "@clerk/nextjs/server";
import { useTheme } from 'next-themes';

export default function Sidebar() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk()
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  
  // Fetch user data
  const convexUser = useQuery(api.users.getCurrentUser);
  const { user: clerkUser } = useUser();
  
  // Fetch notification count
  const notificationsData = useQuery(api.notifications.getUserNotifications, {
    filter: "unread",
    limit: 1, // We only need the count, not actual notifications
  });
  const unreadCount = notificationsData?.unreadCount || 0;
  
  // Reset selectedPath when pathname changes
  useEffect(() => {
    setSelectedPath(pathname);
  }, [pathname]);
  
  // Handle initial render
  useEffect(() => {
    setIsMounted(true);
    setSelectedPath(pathname);
  }, []);
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }
  
  // Check if a path is active
  const isActive = (path: string) => {
    // Check both the current pathname and the selectedPath
    // This ensures the link appears active immediately on click
    return selectedPath === path || pathname === path;
  };
  
  // Handle link click with immediate feedback
  const handleLinkClick = (path: string) => {
    // Update the local state immediately
    setSelectedPath(path);
    // No need to wait for the pathname to change via navigation
  };
  
  // Extract user info - use Convex data if available, fallback to Clerk
  const userDisplayName = convexUser?.name || clerkUser?.fullName || "User";
  const userEmail = convexUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || "";
  const userImageUrl = convexUser?.imageUrl || clerkUser?.imageUrl || "";
  const userInitials = userDisplayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  
  // Determine logo based on the *resolved* theme
  const logoSrc = resolvedTheme === 'dark'
    ? '/alterionlogo-small-light.png'
    : '/alterionlogo-small-dark.png';

  return (
    <div className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo section */}
      <div className="p-4 border-b flex items-center space-x-2 justify-center">
        <div className="h-8 w-8">
          <a href="/">
            <Image src={logoSrc} alt="logo" width={32} height={32} />
          </a>
        </div>
      </div>

      {/* User profile section */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={userImageUrl} alt={userDisplayName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{userDisplayName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/dashboard")}>
          <Button 
            variant={isActive("/dashboard") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/dashboard") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <Home className="h-4 w-4 mr-3" />
            Dashboard
          </Button>
        </Link>

               
        <Link href="/negotiations" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/negotiations")}>
          <Button 
            variant={isActive("/negotiations") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/negotiations") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <FileText className="h-4 w-4 mr-3" />
            Negotiations
          </Button>
        </Link>
        
        <Link href="/offers" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/offers")}>
          <Button 
            variant={isActive("/offers") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/offers") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <Package className="h-4 w-4 mr-3" />
            Freight Offers
          </Button>
        </Link>

        {/* <Link href="/contacts" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/contacts")}>
          <Button
            variant={isActive("/contacts") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/contacts") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4 mr-3" />
            Contacts
          </Button>
        </Link> */}

        
        {/* <Link href="/routes" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/routes")}>
          <Button 
            variant={isActive("/routes") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/routes") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <Map className="h-4 w-4 mr-3" />
            Route Planning
          </Button>
        </Link>
        
        <Link href="/analytics" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/analytics")}>
          <Button 
            variant={isActive("/analytics") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/analytics") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <BarChart2 className="h-4 w-4 mr-3" />
            Analytics
          </Button>
        </Link>
        
        <Link href="/tracking" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/tracking")}>
          <Button 
            variant={isActive("/tracking") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/tracking") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <Truck className="h-4 w-4 mr-3" />
            Delivery Tracking
          </Button>
        </Link>
        
        <Link href="/invoices" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/invoices")}>
          <Button 
            variant={isActive("/invoices") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/invoices") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <FileText className="h-4 w-4 mr-3" />
            Invoices
          </Button>
        </Link>
        
        <Link href="/partners" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/partners")}>
          <Button 
            variant={isActive("/partners") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/partners") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <Users className="h-4 w-4 mr-3" />
            Partners
          </Button>
        </Link> */}

        <Separator className="my-3" />

        <Link href="/notifications" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/notifications")}>
          <Button 
            variant={isActive("/notifications") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none relative",
              isActive("/notifications") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <Bell className="h-4 w-4 mr-3" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>
{/*         
        <Link href="/compliance" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/compliance")}>
          <Button 
            variant={isActive("/compliance") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/compliance") ? "font-medium" : "font-normal text-gray-600"
            )}
          >
            <Shield className="h-4 w-4 mr-3" />
            Compliance
          </Button>
        </Link> */}
        
        <Link href="/settings" prefetch={true} className="block w-full" onClick={() => handleLinkClick("/settings")}>
          <Button 
            variant={isActive("/settings") ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-none",
              isActive("/settings") ? "font-medium" : "font-normal text-muted-foreground"
            )}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
        </Link>
      </nav>

      {/* Sign out section */}
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground font-normal"
          onClick={() => { router.push("/"); signOut(); }}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
} 