"use client";

import * as React from "react";

interface TokenUsageBarProps {
  used: number;
  limit: number;
  label?: string;
  className?: string;
}

export function TokenUsageBar({
  used,
  limit,
  label = "Token usage",
  className,
}: TokenUsageBarProps) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className={["w-full", className].join(" ")}>
      <div className="flex items-center justify-between mb-1 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="text-[0.75rem] text-muted-foreground mt-1">
        {pct.toFixed(0)}% used
      </div>
    </div>
  );
}
