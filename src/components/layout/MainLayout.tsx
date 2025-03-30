"use client";

import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, Home, Truck, MessageSquare, Bell, User, BarChart2, Settings, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
      >
        <div className="w-5 h-5">{icon}</div>
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navigation = [
    // { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Truck size={20} />, label: "Transport Offers", href: "/offers" },
    { icon: <MessageSquare size={20} />, label: "Negotiations", href: "/negotiations" },
    // { icon: <BarChart2 size={20} />, label: "Analytics", href: "/analytics" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="flex items-center gap-2 px-6 h-16 border-b">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Truck size={20} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl">AI Transport</span>
        </div>
        <nav className="flex-1 pt-5 pb-4 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/support">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
              <div className="w-5 h-5">
                <LogOut size={20} />
              </div>
              <span className="font-medium">Sign Out</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-card">
          <div className="flex items-center md:hidden">
            {/* Mobile Sheet */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <div className="flex items-center gap-2 px-6 h-16 border-b">
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                    <Truck size={20} className="text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-xl">AI Transport</span>
                </div>
                <nav className="flex-1 pt-5 pb-4 px-4 space-y-1 overflow-y-auto">
                  {navigation.map((item) => (
                    <NavItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      active={pathname === item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                    />
                  ))}
                </nav>
                <div className="p-4 border-t">
                  <Link href="/support">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
                      <div className="w-5 h-5">
                        <LogOut size={20} />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 