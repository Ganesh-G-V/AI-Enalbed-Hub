"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbsProps {
  items: { label: string; href: string }[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Breadcrumb"
      className={["flex items-center gap-1 text-xs text-muted-foreground", className].join(" ")}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = pathname === item.href;
        return (
          <React.Fragment key={item.label}>
            {last ? (
              <span className="text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className={[
                  "flex items-center gap-1 transition-colors",
                  active ? "text-foreground" : "hover:text-foreground",
                ].join(" ")}
              >
                {item.label}
              </Link>
            )}
            {!last && <ChevronRight size={14} className="shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
