"use client";

import * as React from "react";
import { Label } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  items: { value: string; label: string; disabled?: boolean }[];
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function SelectField({
  label,
  name,
  value,
  onValueChange,
  items,
  hint,
  required,
  error,
  className,
}: SelectFieldProps) {
  return (
    <div className={["space-y-1", className].join(" ")}>
      <Label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive text-xs">*</span>}
      </Label>
      {error ? (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
        <Select onValueChange={(v) => onValueChange(v ?? null)} defaultValue={value ?? undefined}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} disabled={item.disabled} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
