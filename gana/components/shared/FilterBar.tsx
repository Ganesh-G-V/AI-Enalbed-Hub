"use client";

import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

interface FilterBarProps {
  filters: { key: string; label: string; options: { value: string; label: string }[] }[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  className?: string;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={[
        "flex flex-wrap gap-3 items-end mb-6 border-b border-border pb-2",
        className,
      ].join(" ")}
    >
      {filters.map(({ key, label, options }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}:</span>
          <input
            type="text"
            className="w-[140px] rounded-lg border border-border bg-background p-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            value={activeFilters[key] ?? ""}
            onChange={(e) => onFilterChange(key, e.target.value)}
            placeholder={`All ${label}`}
          />
          {activeFilters[key] && (
            <ShadcnButton
              variant="outline"
              size="xs"
              onClick={() => onFilterChange(key, "")}
              className="ml-1 px-1.5"
              data-testid={`filter-clear-${key}`}
            >
              ×
            </ShadcnButton>
          )}
        </div>
      ))}
    </div>
  );
}
