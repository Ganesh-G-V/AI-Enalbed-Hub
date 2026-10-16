"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/shared/Badge";
import { CopyButton } from "@/components/shared/CopyButton";
import { Cpu, ShieldCheck, AlertTriangle, Link as LinkIcon } from "lucide-react";

interface ToolCardProps {
  id: string;
  name: string;
  provider: string;
  category: string;
  capabilities: string[];
  approvalStatus: string;
  dataHandling: string;
  docsUrl?: string;
  limitations?: string;
  reviewedAt?: string | Date | null;
  className?: string;
}

export function ToolCard({
  id,
  name,
  provider,
  category,
  capabilities,
  approvalStatus,
  dataHandling,
  docsUrl,
  limitations,
  reviewedAt,
  className,
}: ToolCardProps) {
  const statusVariant: Record<string, string> = {
    approved: "success",
    pending: "warning",
    restricted: "warning",
    declined: "destructive",
  };

  return (
    <Card className={["overflow-hidden hover:border-primary/50 transition-colors border", className].join(" ")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{name}</CardTitle>
          <Badge variant={statusVariant[approvalStatus] as any} className="text-[0.7rem] px-2 py-1">
            {approvalStatus}
          </Badge>
        </div>
        <CardDescription className="text-[0.8rem]">{provider}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[0.7rem] px-2 py-1">{category}</Badge>
          <Badge variant="secondary" className="text-[0.7rem] px-2 py-1">{provider}</Badge>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {capabilities.slice(0, 4).map((cap) => (
            <Badge key={cap} variant="secondary" className="text-[0.7rem] px-2 py-1">
              {cap}
            </Badge>
          ))}
        </div>
        <div className="text-[0.8rem] text-muted-foreground">
          <ShieldCheck className="mr-1 size-4" /> {dataHandling}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
          <Cpu className="size-3.5" /> {capabilities.length} capabilities
        </div>
        {docsUrl && (
          <Link
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[0.7rem] text-primary underline underline-offset-4 hover:text-primary/80"
          >
            <LinkIcon className="size-3.5" /> Docs
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
