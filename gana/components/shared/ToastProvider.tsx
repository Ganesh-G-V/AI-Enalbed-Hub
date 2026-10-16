"use client";

import * as React from "react";
import { Toaster, toast } from "sonner";
import "sonner/styles.css";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" richColors className="fixed top-0 z-[100]" />
      {children}
    </>
  );
}
