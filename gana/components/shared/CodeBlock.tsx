"use client";

import * as React from "react";
import { Code as CodeIcon } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "text",
  copyable = true,
  className,
}: CodeBlockProps) {
  return (
    <div className={["rounded-lg border border-border bg-muted p-4", className].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{language}</span>
        {copyable && <CopyButton value={code} size="sm" label="Copy" />}
      </div>
      <pre className="m-0 font-mono text-xs text-foreground overflow-x-auto whitespace-pre break-words">
        <code>{code}</code>
      </pre>
    </div>
  );
}
