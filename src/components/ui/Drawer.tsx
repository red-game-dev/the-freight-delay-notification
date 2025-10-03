/**
 * Drawer component for mobile navigation
 * Based on the-game-library implementation with proper z-index and animations
 */

'use client';

import { MouseEvent, ReactNode, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
  title?: string;
  showOverlay?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  side = 'left',
  title,
  showOverlay = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  showCloseButton = true,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  const handleEscKey = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (closeOnOverlay) {
        onClose();
      }
    },
    [closeOnOverlay, onClose]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle keyboard events and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store current active element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Add ESC key listener
    if (closeOnEsc) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Focus drawer on open
    if (drawerRef.current) {
      drawerRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);

      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEsc, handleEscKey]);

  // Trap focus within drawer
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }, []);

  if (!isOpen) return null;

  const sideStyles = {
    left: 'left-0',
    right: 'right-0',
  };

  const borderStyles = {
    left: 'border-r',
    right: 'border-l',
  };

  const animationClass = {
    left: 'drawer-slide-left',
    right: 'drawer-slide-right',
  };

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] drawer-overlay-fade"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          drawer-panel fixed top-0 ${sideStyles[side]} h-full w-72 sm:w-80
          ${borderStyles[side]} shadow-xl z-[1010]
          flex flex-col outline-none
          ${animationClass[side]}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0 min-h-[3.5rem]">
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                iconOnly
                className="ml-auto flex-shrink-0"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
