"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { 
  Truck, 
  MessageSquare, 
  BarChart2, 
  Settings, 
  Map,
  LogOut,
  Users,
  Clock,
  Bell,
  ShieldCheck,
  CircleDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | number;
  isActive: boolean;
  isCollapsed: boolean;
}

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | number;
}

interface SidebarProps {
  isCollapsed: boolean;
}

const NavItem = ({ icon, label, href, badge, isActive, isCollapsed }: NavItemProps) => {
  return (
    <Link href={href} className="w-full">
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg px-3.75 py-2.5 text-sm font-medium transition-all",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <div className="flex min-w-[24px] items-center justify-center">
          {icon}
        </div>
        
        <div className={cn(
          "flex flex-1 items-center transition-all duration-300 ease-in-out",
          isCollapsed ? "w-0 opacity-0" : "opacity-100"
        )}>
          <span className="truncate">{label}</span>
        </div>
        
        {badge && (
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed 
              ? "absolute -right-2 -top-1" 
              : "relative"
          )}>
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center justify-center rounded-full text-xs font-semibold",
                isCollapsed ? "h-5" : "h-5 w-5",
                isActive 
                  ? "border-sidebar-primary-foreground/30 bg-sidebar-primary-foreground/20" 
                  : "border-sidebar-accent-foreground/30 bg-sidebar-accent/30"
              )}
            >
              {badge}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
};

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  
  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser);
  
  // Handle initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }
  
  const handleSignOut = () => {
    signOut();
  };
  
  const navigation: NavigationItem[] = [
    { 
      icon: <Truck size={18} />, 
      label: "Transport Offers", 
      href: "/offers"
    },
    { 
      icon: <MessageSquare size={18} />, 
      label: "Negotiations", 
      href: "/negotiations"
    },
    { 
      icon: <Map size={18} />, 
      label: "Route Planning", 
      href: "/routes" 
    },
    { 
      icon: <BarChart2 size={18} />, 
      label: "Analytics", 
      href: "/analytics" 
    },
    { 
      icon: <Clock size={18} />, 
      label: "Delivery Tracking", 
      href: "/tracking" 
    },
    { 
      icon: <CircleDollarSign size={18} />, 
      label: "Invoices", 
      href: "/invoices" 
    },
    { 
      icon: <Users size={18} />, 
      label: "Partners", 
      href: "/partners" 
    },
  ];
  
  const secondaryNavigation: NavigationItem[] = [
    { 
      icon: <Bell size={18} />, 
      label: "Notifications", 
      href: "/notifications"
    },
    { 
      icon: <ShieldCheck size={18} />, 
      label: "Compliance", 
      href: "/compliance" 
    },
    { 
      icon: <Settings size={18} />, 
      label: "Settings", 
      href: "/settings" 
    },
  ];

  // Extract user info - use Convex data if available, fallback to Clerk
  const userDisplayName = convexUser?.name || clerkUser?.fullName || "User";
  const userImageUrl = convexUser?.imageUrl || clerkUser?.imageUrl || "";
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-20 flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      {/* Logo section */}
      <div className="flex h-16 items-center justify-center border-b px-3 py-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <Image src="/alterionlogo-small-dark.png" alt="Alterion Logo" width={32} height={32} />
            </div>
            {/* <span className="text-lg font-semibold">lterion</span> */}
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md">
            <Image src="/alterionlogo-small-dark.png" alt="Alterion Logo" width={32} height={32} />
          </div>
        )}
      </div>
      
      {/* Profile section */}
      <div className="relative flex items-center border-b p-4">
        <Avatar className="h-10 w-10 border flex-shrink-0">
          <AvatarImage src={userImageUrl} alt={userDisplayName} />
          <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-foreground font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "ml-3 flex flex-col overflow-hidden transition-all duration-300",
          isCollapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
        )}>
          <span className="truncate text-sm font-medium">{userDisplayName}</span>
          <span className="truncate text-xs text-sidebar-foreground/70">
            {convexUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || ""}
          </span>
        </div>
      </div>
      
      {/* Main navigation */}
      <div className="flex-1 overflow-y-scroll scrollbar-hide p-2">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              badge={item.badge}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
          
          <div className={cn(
            "relative my-2 border-t border-sidebar-border/50 transition-all duration-300",
            isCollapsed ? "opacity-30" : "opacity-100"
          )} />
          
          {secondaryNavigation.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              badge={item.badge}
              isActive={pathname === item.href}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
      
      {/* Bottom actions */}
      <div className="border-t p-2 px-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "w-0 ml-0" : "w-auto ml-2"
          )}>
            <span className="whitespace-nowrap">Sign Out</span>
          </div>
        </Button>
      </div>
    </div>
  );
} 