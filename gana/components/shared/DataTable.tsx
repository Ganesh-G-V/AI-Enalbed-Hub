import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/shared/Badge";

interface DataTableProps<T extends Record<string, unknown>> {
  columns: { key: string; header: string; render?: (value: unknown, row: T) => React.ReactNode }[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={["rounded-lg border border-border bg-card p-4", className].join(" ")}>
        <TableCaption className="text-sm font-medium text-foreground mb-3">
          {emptyMessage}
        </TableCaption>
      </div>
    );
  }

  return (
    <div className={["rounded-lg border border-border bg-card overflow-hidden", className].join(" ")}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="text-xs font-medium text-muted-foreground bg-muted">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={String(rowIndex)} className="border-b border-border last:border-0">
              {columns.map((col) => {
                const value = row[col.key];
                const rendered = col.render
                  ? col.render(value, row)
                  : (
                    <span className="text-xs text-foreground">{String(value ?? "")}</span>
                  );
                return (
                  <TableCell key={col.key} className="p-3 text-xs">
                    {rendered}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
