"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "AI Tool Finder", href: "/tools" },
  { name: "Prompt Library", href: "/prompts" },
  { name: "Token & Cost Lab", href: "/token-lab" },
  { name: "Knowledge Center", href: "/knowledge" },
  { name: "Knowledge Assistant", href: "/assistant" },
  { name: "Evaluation Lab", href: "/evaluations" },
  { name: "What's New", href: "/whats-new" },
  { name: "Agents & IDEs", href: "/agents" },
  { name: "Analytics", href: "/analytics" },
  { name: "Admin Settings", href: "/admin" },
];

export default function MobileNavigation() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[256px] p-4">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold">Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  className={[
                    "w-full flex items-center gap-3 rounded-md text-sm font-medium justify-start text-left transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {item.name}
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
