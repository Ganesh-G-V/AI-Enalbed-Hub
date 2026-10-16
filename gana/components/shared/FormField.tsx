"use client";

import * as React from "react";
import { Label } from "@/components/ui/form";

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  hint,
  required,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={["space-y-1", className].join(" ")}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive text-xs">*</span>}
      </Label>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-1">{children}</div>
    </div>
  );
}
