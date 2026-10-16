"use client";

import * as React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav className={["flex items-center justify-between", className].join(" ")}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-50 disabled:pointer-events-none hover:bg-muted"
        >
          Prev
        </button>
        {(() => {
          const items: React.ReactNode[] = [];
          const start = Math.max(1, page - 2);
          const end = Math.min(pageCount, page + 2);
          if (start > 1) {
            items.push(
              <button
                key="first"
                onClick={() => onPageChange(1)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                1
              </button>
            );
            items.push(<span key="ellipsis" className="px-2 text-xs text-muted-foreground">…</span>);
          }
          for (let i = start; i <= end; i++) {
            items.push(
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-sm",
                  i === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {i}
              </button>
            );
          }
          if (end < pageCount) {
            items.push(<span key="ellipsis-end" className="px-2 text-xs text-muted-foreground">…</span>);
            items.push(
              <button
                key="last"
                onClick={() => onPageChange(pageCount)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                {pageCount}
              </button>
            );
          }
          return items;
        })()}
        <button
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-50 disabled:pointer-events-none hover:bg-muted"
        >
          Next
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Showing {((page - 1) * pageSize + 1).toLocaleString()} to{" "}
        {Math.min(page * pageSize, total).toLocaleString()} of{" "}
        {total.toLocaleString()} results
      </div>
    </nav>
  );
}
