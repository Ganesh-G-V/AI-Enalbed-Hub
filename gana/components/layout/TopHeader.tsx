"use client";

import * as React from "react";
import { Bell, Settings, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";

interface TopHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function TopHeader({
  title,
  description,
  className,
}: TopHeaderProps) {
  return (
    <div className={["flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10", className].join(" ")}>
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="hidden sm:flex items-center gap-2 text-xs">
          <Calendar size={14} className="mr-1" />
          Oct 25, 2026
        </Button>
        <Button size="sm" variant="outline" className="flex items-center gap-2 text-xs">
          <Bell size={14} className="mr-1" />
          <Badge variant="outline" className="ml-1">3</Badge>
        </Button>
        <Button size="sm" variant="ghost" aria-label="User menu">
          <Settings size={16} />
        </Button>
      </div>
    </div>
  );
}
