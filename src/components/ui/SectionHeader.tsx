/**
 * SectionHeader Component
 * Consistent section title and description for cards/sections
 */

import type { FC, ReactNode } from "react";
import { cn } from "@/core/base/utils/cn";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    title: "text-lg font-semibold",
    description: "text-xs",
  },
  md: {
    title: "text-xl font-bold",
    description: "text-sm",
  },
  lg: {
    title: "text-xl sm:text-2xl font-bold",
    description: "text-sm sm:text-base",
  },
};

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  description,
  children,
  className,
  size = "md",
}) => {
  const classes = sizeClasses[size];

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex-1">
        <h2 className={classes.title}>{title}</h2>
        {description && (
          <p className={cn(classes.description, "text-muted-foreground mt-1")}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

SectionHeader.displayName = "SectionHeader";
