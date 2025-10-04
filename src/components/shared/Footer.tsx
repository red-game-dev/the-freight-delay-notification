/**
 * Footer Component
 * Site footer with links and company information
 */

"use client";

import { Github, Mail, Package, Shield, TruckIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import {
  APP_NAME,
  REPOSITORY,
  ROUTES,
  SOCIAL_LINKS,
  TECH_STACK,
} from "@/core/config/constants/app.constants";
import { ThemeToggle } from "../ThemeToggle";

export interface FooterProps {
  /** Show theme switcher */
  showThemeSwitcher?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode for minimal footer */
  compact?: boolean;
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const Footer: React.FC<FooterProps> = ({
  showThemeSwitcher = true,
  className = "",
  compact = false,
}) => {
  const currentYear = new Date().getFullYear();

  // Footer navigation sections
  const footerSections: FooterSection[] = [
    {
      title: "Navigation",
      links: [
        { label: "Home", href: ROUTES.HOME },
        { label: "Deliveries", href: ROUTES.DELIVERIES },
        { label: "Monitoring", href: ROUTES.MONITORING },
        { label: "Notifications", href: ROUTES.NOTIFICATIONS },
        { label: "Workflows", href: ROUTES.WORKFLOWS },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "How to Use", href: ROUTES.HOW_TO_USE },
        { label: "Documentation", href: REPOSITORY.README },
        { label: "API Reference", href: REPOSITORY.DOCS },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "GitHub Issues", href: REPOSITORY.ISSUES },
        { label: "Contact", href: SOCIAL_LINKS.EMAIL },
      ],
    },
  ];

  // Compact footer for minimal display
  if (compact) {
    return (
      <footer className={`border-t bg-background ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs text-muted-foreground text-center sm:text-left order-2 sm:order-1">
              © {currentYear} {APP_NAME}. Built with {TECH_STACK.FRONTEND} &{" "}
              {TECH_STACK.WORKFLOWS}.
            </p>
            {showThemeSwitcher && (
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <span className="text-xs text-muted-foreground">Theme:</span>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`border-t bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Footer Content */}
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-6 lg:gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6" />
                <span className="font-bold text-base">{APP_NAME}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Real-time freight delivery monitoring with intelligent delay
                notifications. Built with {TECH_STACK.WORKFLOWS} workflows,{" "}
                {TECH_STACK.FRONTEND}, and modern web technologies.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={REPOSITORY.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.EMAIL}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            {footerSections.map((section) => (
              <div key={section.title} className="min-w-0">
                <h4 className="font-semibold text-sm mb-3 sm:mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block py-1 sm:py-0"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block py-1 sm:py-0"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Switcher */}
        {showThemeSwitcher && (
          <div className="border-t py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Theme:</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Secure Monitoring</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TruckIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Real-time Tracking</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-muted-foreground">
            <p className="text-center sm:text-left order-2 sm:order-1">
              © {currentYear} {APP_NAME}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 order-1 sm:order-2">
              <Link
                href={ROUTES.HOW_TO_USE}
                className="hover:text-foreground transition-colors py-1"
              >
                Documentation
              </Link>
              <span className="hidden sm:inline">•</span>
              <a
                href={REPOSITORY.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors py-1"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="border-t py-4">
          <p className="text-xs text-center text-muted-foreground leading-relaxed px-2">
            🚚 Powered by {TECH_STACK.WORKFLOWS} Workflows • {TECH_STACK.AI} •{" "}
            {TECH_STACK.TRAFFIC} • {TECH_STACK.NOTIFICATIONS}
          </p>
        </div>
      </div>
    </footer>
  );
};

Footer.displayName = "Footer";

export default Footer;
