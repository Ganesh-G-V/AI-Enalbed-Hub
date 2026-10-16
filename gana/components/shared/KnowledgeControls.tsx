"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";

interface KnowledgeControlsProps {
  page: number;
  q: string;
  total: number;
  pageSize: number;
}

export function KnowledgeControls({ page, q, total, pageSize }: KnowledgeControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/knowledge?${params.toString()}`);
  };

  const handlePageChange = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNum));
    router.push(`/knowledge?${params.toString()}`);
  };

  return (
    <>
      <FilterBar
        filters={[{ key: "q", label: "Search", options: [] }]}
        activeFilters={{ q }}
        onFilterChange={handleFilterChange}
      />
      {total > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={handlePageChange} />
      )}
    </>
  );
}
