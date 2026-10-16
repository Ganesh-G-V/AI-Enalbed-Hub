"use client";

import * as React from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { TopHeader } from "@/components/layout/TopHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
  headerTitle: string;
  headerDescription?: string;
  breadcrumbs?: { label: string; href: string }[];
  hideSidebar?: boolean;
}

export function AppShell({
  children,
  headerTitle,
  headerDescription,
  breadcrumbs,
  hideSidebar = false,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TooltipProvider>
        <TopHeader title={headerTitle} description={headerDescription} />
        <div className="flex-1 flex overflow-hidden">
          {!hideSidebar && <Sidebar />}
          {!hideSidebar && <MobileNavigation />}
          <main className={`flex-1 overflow-y-auto bg-background p-4 ${hideSidebar ? "mx-auto max-w-[1536px]" : ""}`}>
            <div className={hideSidebar ? "" : "mx-auto max-w-[1536px]"}>
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="mb-3">
                  <Breadcrumbs items={breadcrumbs} />
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </TooltipProvider>
    </div>
  );
}
