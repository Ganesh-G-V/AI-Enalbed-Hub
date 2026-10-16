"use client";

import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: "default" | "sm";
  className?: string;
}

export function CopyButton({
  value,
  label = "Copy",
  size = "default",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ShadcnButton
      onClick={handleCopy}
      size={size}
      variant="outline"
      className={className}
      aria-label={label}
      data-testid="copy-button"
    >
      {copied ? (
        <>
          <Check className="mr-2 size-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="mr-2 size-4" />
          {label}
        </>
      )}
    </ShadcnButton>
  );
}
