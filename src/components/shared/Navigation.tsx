/**
 * Main Navigation Component
 */

"use client";

import {
  Activity,
  Bell,
  BookOpen,
  Home,
  Menu,
  Package,
  TruckIcon,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Deliveries", href: "/deliveries", icon: TruckIcon },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "How to Use", href: "/how-to-use", icon: BookOpen },
];

export function Navigation() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 w-full">
          {/* Logo - Left side */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-bold text-sm sm:text-base hidden sm:inline">
                Freight Delay Notification
              </span>
              <span className="font-bold text-sm sm:inline md:hidden">FDN</span>
            </Link>
          </div>

          {/* Spacer to push theme toggle to the right */}
          <div className="flex-1" />

          {/* Theme toggle - Desktop only */}
          <div className="hidden md:block mr-4">
            <ThemeToggle />
          </div>

          {/* Mobile menu button - Right side */}
          <Button
            onClick={() => setIsDrawerOpen(true)}
            variant="ghost"
            size="sm"
            iconOnly
            className="md:hidden ml-auto"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile drawer - Right side */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        side="right"
        title="Menu"
      >
        <nav className="flex flex-col space-y-1 mb-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle in drawer */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </Drawer>
    </>
  );
}
