"use client";

import { memo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | number;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = memo(({ icon, label, href, badge, isActive, isCollapsed }: NavItemProps) => {
  return (
    <Link href={href} className="w-full">
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg px-3.75 py-2.5 text-sm font-medium",
          isActive 
            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <div className="flex min-w-[24px] items-center justify-center">
          {icon}
        </div>
        
        <div className={cn(
          "flex flex-1 items-center transition-width transition-opacity duration-300 ease-in-out",
          isCollapsed ? "w-0 opacity-0" : "opacity-100"
        )}>
          <span className="truncate">{label}</span>
        </div>
        
        {badge && (
          <div className={cn(
            "flex items-center transition-position duration-300",
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
});

NavItem.displayName = "NavItem";

export default NavItem; 