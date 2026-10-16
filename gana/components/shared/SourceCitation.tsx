"use client";

import * as React from "react";
import { ExternalLink, Quote } from "lucide-react";

interface SourceCitationProps {
  title: string;
  url?: string;
  version?: string;
  reviewedAt?: string;
  className?: string;
}

export function SourceCitation({
  title,
  url,
  version,
  reviewedAt,
  className,
}: SourceCitationProps) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded border border-border bg-muted p-2 text-xs text-muted-foreground",
        className,
      ].join(" ")}
    >
      <Quote className="size-4 shrink-0" />
      <div className="truncate">{title}</div>
      {version && <span className="mx-1">·</span>}
      {version && <span>{version}</span>}
      {reviewedAt && <span className="mx-1">· {reviewedAt}</span>}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-primary underline underline-offset-4 hover:text-primary/80"
        >
          <ExternalLink className="size-4 shrink-0" />
        </a>
      )}
    </div>
  );
}
