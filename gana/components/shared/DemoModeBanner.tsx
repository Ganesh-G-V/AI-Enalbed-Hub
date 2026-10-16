"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DemoModeBanner() {
  const [demo, setDemo] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof document !== "undefined") {
      setDemo(document.documentElement.dataset.demoMode === "true");
    }
  }, []);

  if (demo === null || !demo) return null;
  return (
    <Alert className="mb-4">
      <AlertTitle>Demo mode</AlertTitle>
      <AlertDescription>
        <Info className="mr-2 size-4" />
        Displaying seeded sample data. No live AI provider is configured. Numbers
        are illustrative and do not represent actual organizational usage.
      </AlertDescription>
    </Alert>
  );
}
