import * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";

export type ModelStatus = "approved" | "preview" | "deprecated";

interface ModelBadgeProps {
  model: string;
  provider?: string;
  status?: ModelStatus;
  className?: string;
}

export function ModelBadge({
  model,
  provider,
  status = "approved",
  className,
}: ModelBadgeProps) {
  const statusVariants: Record<ModelStatus, string> = {
    approved: "bg-success text-success-foreground",
    preview: "bg-warning text-warning-foreground",
    deprecated: "bg-muted text-muted-foreground",
  };

  return (
    <div className={["flex items-center gap-1.5", className].join(" ")}>
      <ShadcnBadge variant="outline" className={statusVariants[status]}>
        {status}
      </ShadcnBadge>
      <span className="text-xs font-medium text-foreground">{model}</span>
      {provider && (
        <span className="text-xs text-muted-foreground">· {provider}</span>
      )}
    </div>
  );
}
