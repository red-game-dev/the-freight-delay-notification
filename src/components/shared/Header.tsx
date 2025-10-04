/**
 * Main Header Component
 * Top navigation bar with logo, theme toggle, and mobile menu
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Menu, Home, TruckIcon, Activity, Bell, Workflow, BookOpen } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { APP_NAME, APP_SHORT_NAME, ROUTES } from '@/core/config/constants/app.constants';

const navigation = [
  { name: 'Home', href: ROUTES.HOME, icon: Home },
  { name: 'Deliveries', href: ROUTES.DELIVERIES, icon: TruckIcon },
  { name: 'Monitoring', href: ROUTES.MONITORING, icon: Activity },
  { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: Bell },
  { name: 'Workflows', href: ROUTES.WORKFLOWS, icon: Workflow },
  { name: 'How to Use', href: ROUTES.HOW_TO_USE, icon: BookOpen },
];

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 w-full">
          {/* Logo - Left side */}
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex items-center space-x-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-bold text-sm sm:text-base hidden sm:inline">
                {APP_NAME}
              </span>
              <span className="font-bold text-sm sm:inline md:hidden">{APP_SHORT_NAME}</span>
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
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
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
