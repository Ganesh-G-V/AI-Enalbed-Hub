"use client";

import * as React from "react";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return <ShadcnSkeleton className={className} />;
}
