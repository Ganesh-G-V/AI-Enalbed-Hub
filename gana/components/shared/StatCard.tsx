"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyValue, formatCompactNumber } from "@/lib/formatting";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: string;
  changePositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changePositive,
  icon,
  className,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? formatCompactNumber(value) : value;

  return (
    <Card className={["overflow-hidden", className].join(" ")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="ml-auto text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground tabular-nums">
          {displayValue}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {change && (
          <p
            className={`text-xs font-medium ${
              changePositive ? "text-success" : "text-destructive"
            }`}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
