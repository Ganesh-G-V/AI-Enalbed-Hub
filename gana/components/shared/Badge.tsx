"use client";

import * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";

export type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info" | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground border border-border",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground border border-warning",
  error: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
  outline: "bg-background text-foreground border border-border",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: Omit<React.ComponentProps<typeof ShadcnBadge>, "variant"> & { variant?: BadgeVariant }) {
  return (
    <ShadcnBadge
      variant={variant as any}
      className={VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default}
      {...props}
    />
  );
}
