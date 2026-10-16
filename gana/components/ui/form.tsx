import * as React from "react";
import { Label as ShadcnLabel } from "@radix-ui/react-label";

export const Label = React.forwardRef<
  React.ElementRef<typeof ShadcnLabel>,
  React.ComponentPropsWithoutRef<typeof ShadcnLabel>
>(({ className, ...props }, ref) => (
  <ShadcnLabel ref={ref} className={className} {...props} />
));
Label.displayName = "Label";
