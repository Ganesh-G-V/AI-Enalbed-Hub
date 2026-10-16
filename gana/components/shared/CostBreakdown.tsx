"use client";

import * as React from "react";
import { formatCurrencyValue, formatTokenCount } from "@/lib/formatting";
import { Badge } from "@/components/shared/Badge";

interface CostBreakdownProps {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  inputRate: number;
  outputRate: number;
  cachedRate?: number;
  currency?: string;
}

export function CostBreakdown({
  inputTokens,
  outputTokens,
  cachedTokens,
  inputRate,
  outputRate,
  cachedRate,
  currency = "USD",
}: CostBreakdownProps) {
  const inputCost = (inputTokens / 1_000_000) * inputRate;
  const outputCost = (outputTokens / 1_000_000) * outputRate;
  const cachedCost = cachedTokens ? (cachedTokens / 1_000_000) * (cachedRate ?? inputRate * 0.5) : 0;
  const total = inputCost + outputCost + cachedCost;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-lg border border-border bg-muted">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Input cost</div>
        <div className="text-sm font-medium tabular-nums">{formatCurrencyValue(inputCost)}</div>
        <div className="text-[0.75rem] text-muted-foreground">{formatTokenCount(inputTokens)} tokens</div>
      </div>
      <div className="p-3 rounded-lg border border-border bg-muted">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Output cost</div>
        <div className="text-sm font-medium tabular-nums">{formatCurrencyValue(outputCost)}</div>
        <div className="text-[0.75rem] text-muted-foreground">{formatTokenCount(outputTokens)} tokens</div>
      </div>
      {cachedTokens && cachedTokens > 0 && (
        <div className="p-3 rounded-lg border border-border bg-success/10">
          <div className="text-xs text-success-foreground uppercase tracking-wider">Cached input</div>
          <div className="text-sm font-medium tabular-nums text-success">{`-${formatCurrencyValue(cachedCost)}`}</div>
          <div className="text-[0.75rem] text-muted-foreground">{formatTokenCount(cachedTokens)} tokens</div>
        </div>
      )}
      <div className="p-3 rounded-lg border border-primary bg-primary/5">
        <div className="text-xs text-primary uppercase tracking-wider">Total</div>
        <div className="text-sm font-medium tabular-nums text-primary">{formatCurrencyValue(total)}</div>
        <div className="text-[0.75rem] text-muted-foreground">per request</div>
      </div>
    </div>
  );
}
