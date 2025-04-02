"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, SignOutButton, useAuth } from "@clerk/clerk-react";

// Import UI components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import icons
import {
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Settings,
  LogOut,
  HelpCircle,
  BookOpen,
  Library,
  Workflow,
  Gauge,
  FileCode,
  Users,
  Rocket,
  HeartHandshake,
  PieChart,
  MessageSquare,
  Zap,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";

// Custom hover-enabled dropdown
const HoverDropdown = ({ 
  trigger, 
  children, 
  className = "" 
}: { 
  trigger: React.ReactNode, 
  children: React.ReactNode,
  className?: string 
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center gap-1 cursor-pointer">
        {trigger}
      </div>
      <div 
        className={`absolute top-full left-0 pt-2 z-50 min-w-[200px] transform transition-all duration-200 ease-in-out ${className} ${
          open 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-[-8px] scale-95 pointer-events-none"
        }`}
      >
        <div className="rounded-md border bg-popover p-2 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, systemTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: isAuthLoaded } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';

  // Navigation items with dropdown menus
  const navItems = [
    {
      label: "Product",
      dropdown: [
        { label: "Features", href: "/features", icon: <Sparkles className="w-4 h-4" /> },
        { label: "Integrations", href: "/integrations", icon: <Zap className="w-4 h-4" /> },
        { label: "AI Agents", href: "/ai-agents", icon: <Rocket className="w-4 h-4" /> },
        { label: "Enterprise", href: "/enterprise", icon: <Library className="w-4 h-4" /> },
      ]
    },
    {
      label: "Solutions",
      dropdown: [
        { label: "For Marketing", href: "/solutions/marketing", icon: <PieChart className="w-4 h-4" /> },
        { label: "For Sales", href: "/solutions/sales", icon: <Users className="w-4 h-4" /> },
        { label: "For Developers", href: "/solutions/developers", icon: <FileCode className="w-4 h-4" /> },
        { label: "For Support", href: "/solutions/support", icon: <MessageSquare className="w-4 h-4" /> },
      ]
    },
    {
      label: "Resources",
      dropdown: [
        { label: "Documentation", href: "/docs", icon: <BookOpen className="w-4 h-4" /> },
        { label: "API Reference", href: "/api-reference", icon: <FileCode className="w-4 h-4" /> },
        { label: "Community", href: "/community", icon: <Users className="w-4 h-4" /> },
        { label: "Blog", href: "/blog", icon: <Library className="w-4 h-4" /> },
      ]
    },
    {
      label: "Pricing",
      href: "/pricing"
    },
  ];

  // Auth buttons component with stable width to prevent layout shifts
  const AuthButtons = () => {
    if (!isAuthLoaded || !mounted) {
      // Show placeholders with the same width during loading
      return (
        <div className="flex items-center gap-2 justify-end">
          <div className="w-[72px] h-9 bg-muted/30 rounded-md animate-pulse"></div>
          <div className="w-[72px] h-9 bg-muted/40 rounded-md animate-pulse"></div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 justify-end">
        <SignedIn>
          <Link href="/dashboard">
            <Button variant="default" size="sm">
              Dashboard
            </Button>
          </Link>
          <SignOutButton>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </SignOutButton>
        </SignedIn>
        <SignedOut>
          {/* <Link href="/sign-in"> */}
            <Button variant="ghost" size="sm" onClick={() => toast.success("Coming soon!")}>
              Sign In
            </Button>
          {/* </Link> */}
          {/* <Link href="/sign-up"> */}
            <Button variant="default" size="sm" onClick={() => toast.success("Coming soon!")}>
              Sign Up
            </Button>
          {/* </Link> */}
        </SignedOut>
      </div>
    );
  };

  // Mobile Auth buttons component
  const MobileAuthButtons = () => {
    if (!isAuthLoaded || !mounted) {
      return (
        <div className="pt-2 border-t mt-2">
          <div className="flex flex-col gap-2 pt-2">
            <div className="w-full h-9 bg-muted/30 rounded-md animate-pulse"></div>
            <div className="w-full h-9 bg-muted/40 rounded-md animate-pulse"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-2 border-t mt-2">
        <SignedIn>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/dashboard" className="w-full">
              <Button variant="default" size="sm" className="justify-start w-full" disabled>
                Dashboard
              </Button>
            </Link>
            <SignOutButton>
              <Button variant="outline" size="sm" className="justify-start w-full" disabled>
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col gap-2 pt-2">
            {/* <Link href="/sign-in" className="w-full"> */}
              <Button variant="outline" size="sm" className="justify-start w-full" disabled>
                Sign In
              </Button>
            {/* </Link> */}
            {/* <Link href="/sign-up" className="w-full"> */}
              <Button variant="default" size="sm" className="justify-start w-full" disabled>
                Sign Up
              </Button>
            {/* </Link> */}
          </div>
        </SignedOut>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-8 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid grid-cols-[1fr_auto_1fr] w-full h-full items-center">
          {/* Logo - Left column */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src={currentTheme === 'dark' ? "/alterionlogo-light.png" : "/alterionlogo-dark.png"} 
                alt="Alterion Logo" 
                width={120} 
                height={50}
                style={{ objectFit: 'contain', height: 'auto' }}
                className="w-auto transition-all duration-200"
                suppressHydrationWarning
              />
            </Link>
          </div>
          
          {/* Desktop Navigation - Middle column */}
          <div className="hidden md:flex items-center justify-center space-x-1">
            {navItems.map((item, index) => (
              item.dropdown ? (
                <HoverDropdown 
                  key={index}
                  trigger={
                    <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors group">
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-400 ease-in-out group-hover:-rotate-180" />
                    </div>
                  }
                >
                  <div className="grid gap-1">
                    {item.dropdown.map((dropdownItem, dropdownIndex) => (
                      <Link
                        key={dropdownIndex}
                        href={dropdownItem.href}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {dropdownItem.icon}
                        <span>{dropdownItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </HoverDropdown>
              ) : (
                <Link
                  key={index}
                  href={item.href || "#"}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
          
          {/* Auth Buttons & User Menu - Right column */}
          <div className="flex items-center justify-end">
            <div className="hidden md:block">
              <AuthButtons />
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-2 px-4 bg-background border-t">
          <div className="flex flex-col space-y-1">
            {navItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.dropdown ? (
                  <>
                    <div className="text-sm font-medium px-3 py-2">{item.label}</div>
                    <div className="pl-4 mb-2">
                      {item.dropdown.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          href={dropdownItem.href}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {dropdownItem.icon}
                          <span>{dropdownItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
            
            <MobileAuthButtons />
          </div>
        </div>
      )}
    </nav>
  );
}