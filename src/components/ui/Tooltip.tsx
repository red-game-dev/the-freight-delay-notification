/**
 * Tooltip component
 * Simplified version using Tailwind classes
 */

"use client";

import { type FC, type ReactNode, useRef, useState } from "react";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export const Tooltip: FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      role="tooltip"
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium text-white
            bg-gray-900 dark:bg-gray-700 rounded shadow-lg
            whitespace-nowrap pointer-events-none
            ${positionStyles[position]}
          `}
        >
          {content}
        </div>
      )}
    </span>
  );
};

Tooltip.displayName = "Tooltip";
