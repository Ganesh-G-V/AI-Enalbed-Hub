"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/shared/Badge";
import { formatCurrencyValue } from "@/lib/formatting";
import { Cpu, ShieldCheck, AlertTriangle } from "lucide-react";

interface RecommendationCardProps {
  toolName: string;
  provider: string;
  category: string;
  fitReason: string;
  cost?: string;
  latency?: string;
  warnings?: string[];
  alternatives?: string[];
  className?: string;
}

export function RecommendationCard({
  toolName,
  provider,
  category,
  fitReason,
  cost,
  latency,
  warnings,
  className,
}: RecommendationCardProps) {
  return (
    <Card className={["border-l-2 border-primary overflow-hidden", className].join(" ")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{toolName}</CardTitle>
          <Badge variant="outline" className="text-[0.7rem] px-2 py-1">{category}</Badge>
        </div>
        <div className="text-[0.8rem] text-muted-foreground">{provider}</div>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-sm text-foreground mb-3">{fitReason}</p>
        <div className="grid grid-cols-2 gap-3 mb-3 text-[0.8rem]">
          <div className="flex items-center gap-1">
            <Cpu className="size-3.5 text-muted-foreground" />
            <span>Latency: {latency ?? "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-muted-foreground" />
            <span>Est. cost: {cost ?? "N/A"}</span>
          </div>
        </div>
        {warnings && warnings.length > 0 && (
          <div className="mb-3 p-2 rounded bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2 text-[0.8rem] text-warning-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span className="leading-snug">Data handling warning: {warnings.join(" ")}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="text-[0.75rem] text-muted-foreground">
          Verify outputs before use in production.
        </div>
      </CardFooter>
    </Card>
  );
}
