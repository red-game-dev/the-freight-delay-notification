/**
 * Modal component for dialogs
 * Simplified version using Tailwind classes
 */

"use client";

import { X } from "lucide-react";
import { type FC, type ReactNode, useEffect } from "react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  position?: "center" | "right" | "left";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

const positionStyles = {
  center: "items-center justify-center",
  right: "items-center justify-end pr-4",
  left: "items-center justify-start pl-4",
};

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  position = "center",
}) => {
  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay - Visual only */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1020] h-screen"
        aria-hidden="true"
      />

      {/* Modal Container - Handles clicks */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop click is mouse-only; keyboard users use ESC or close button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop click is mouse-only; keyboard users use ESC or close button */}
      <div
        className={`fixed inset-0 flex overflow-y-auto p-4 z-[1021] min-h-screen ${positionStyles[position]}`}
        onClick={onClose}
      >
        {/* Modal Content */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click handler only prevents backdrop clicks from closing modal */}
        <div
          className={`modal-panel relative rounded-lg shadow-lg w-full pointer-events-auto border ${sizeStyles[size]}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b">
              {title && <h2 className="text-xl font-semibold">{title}</h2>}
              {showCloseButton && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
};

Modal.displayName = "Modal";

export interface ModalFooterProps {
  className?: string;
  children?: ReactNode;
}

export const ModalFooter: FC<ModalFooterProps> = ({
  className = "",
  children,
}) => {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${className}`}
    >
      {children}
    </div>
  );
};

ModalFooter.displayName = "ModalFooter";
