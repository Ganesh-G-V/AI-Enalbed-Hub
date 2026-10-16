"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: SearchInputProps) {
  return (
    <div className={["relative w-full", className].join(" ")}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none">
        <Search />
      </div>
      <Input
        id="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        data-testid="search-input"
      />
    </div>
  );
}
