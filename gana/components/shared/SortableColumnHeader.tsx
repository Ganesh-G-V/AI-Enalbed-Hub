"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, SortAsc, SortDesc } from "lucide-react";

interface SortableColumnHeaderProps {
  key: string;
  label: string;
  sortKey: string;
  sortDirection: "asc" | "desc" | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableColumnHeader({
  key,
  label,
  sortKey,
  sortDirection,
  onSort,
  className,
}: SortableColumnHeaderProps) {
  const active = sortKey === key;
  const isAsc = active && sortDirection === "asc";

  return (
    <Button
      onClick={() => onSort(key)}
      variant="ghost"
      className={[
        "w-full text-left text-xs font-medium text-muted-foreground hover:text-foreground",
        active ? "text-primary" : "",
      ].join(" ")}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (
          isAsc ? (
            <SortAsc className="size-3.5 ml-1" />
          ) : (
            <SortDesc className="size-3.5 ml-1" />
          )
        ) : (
          <ChevronUp className="size-3.5 ml-1 text-muted-foreground" />
        )}
      </span>
    </Button>
  );
}
