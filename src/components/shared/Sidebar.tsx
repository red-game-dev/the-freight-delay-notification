/**
 * Sidebar Component for Dashboard Navigation
 */

"use client";

import {
  Activity,
  Bell,
  Home,
  Package,
  Settings,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ROUTES } from "@/core/config/constants/app.constants";

const navigation = [
  {
    name: "Home",
    href: ROUTES.HOME,
    icon: Home,
  },
  {
    name: "Deliveries",
    href: ROUTES.DELIVERIES,
    icon: Package,
  },
  {
    name: "Monitoring",
    href: ROUTES.MONITORING,
    icon: Activity,
  },
  {
    name: "Notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: Bell,
  },
  {
    name: "Workflows",
    href: ROUTES.WORKFLOWS,
    icon: Workflow,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "How to use",
    href: ROUTES.HOW_TO_USE,
    icon: Workflow,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-background/95">
      <nav className="flex flex-1 flex-col gap-y-7 px-6 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
