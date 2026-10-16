"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ToolCard } from "@/components/shared/ToolCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { SelectField } from "@/components/shared/SelectField";
import { EmptyState } from "@/components/shared/EmptyState";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { apiFetch } from "@/lib/api-client";

const CATEGORY_OPTIONS = [
  { value: "CODING", label: "Coding" },
  { value: "DEBUGGING", label: "Debugging" },
  { value: "TESTING", label: "Testing" },
  { value: "CODE_REVIEW", label: "Code review" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "DATA_ANALYSIS", label: "Data analysis" },
  { value: "SQL", label: "SQL" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "RESEARCH", label: "Research" },
  { value: "SUMMARIZATION", label: "Summarization" },
  { value: "KNOWLEDGE_RETRIEVAL", label: "Knowledge retrieval" },
  { value: "CUSTOMER_SUPPORT", label: "Customer support" },
];
const APPROVAL_OPTIONS = ["approved", "pending", "restricted", "declined"];

function ToolsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tools, setTools] = React.useState<any[]>([]);
  const [capabilities, setCapabilities] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const category = searchParams.get("category") ?? "";
  const approvalStatus = searchParams.get("approvalStatus") ?? "";
  const capability = searchParams.get("capability") ?? "";
  const q = searchParams.get("q") ?? "";

  const demo = document.documentElement.dataset.demoMode === "true";

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/tools?page=1&pageSize=200${category ? `&category=${category}` : ""}${approvalStatus ? `&approvalStatus=${approvalStatus}` : ""}${capability ? `&capability=${capability}` : ""}${q ? `&search=${q}` : ""}`);
      setTools(data.items);
      const capSet = new Set<string>();
      for (const t of data.items) for (const c of (t.capabilities ?? [])) capSet.add(c);
      setCapabilities(Array.from(capSet).sort());
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [category, approvalStatus, capability, q]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <AppShell
      headerTitle="AI Tool Finder"
      headerDescription="Search and filter the approved AI tool catalogue."
      breadcrumbs={[{ label: "AI Hub", href: "/dashboard" }, { label: "Tool Finder", href: "/tools" }]}
    >
      <DemoModeBanner />
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={q}
            onChange={(v) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("q", v);
              router.push(`${pathname}?${params.toString()}`);
            }}
            placeholder="Search tools by name or provider"
          />
          <SelectField
            label="Category"
            name="category"
            value={category || null}
            onValueChange={(v) => setFilter("category", v ?? "")}
            items={CATEGORY_OPTIONS.map((v) => ({ value: v.value, label: v.label }))}
          />
          <SelectField
            label="Approval status"
            name="approvalStatus"
            value={approvalStatus || null}
            onValueChange={(v) => setFilter("approvalStatus", v ?? "")}
            items={APPROVAL_OPTIONS.map((v) => ({ value: v, label: v.replace(/_/g, " ") }))}
          />
          <SelectField
            label="Capability"
            name="capability"
            value={capability || null}
            onValueChange={(v) => setFilter("capability", v ?? "")}
            items={capabilities.map((v) => ({ value: v, label: v }))}
          />
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground mt-2">Loading…</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            {tools.length} tool{tools.length !== 1 ? "s" : ""} matched.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.length > 0 ? (
          tools.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              name={tool.name}
              provider={tool.provider}
              category={tool.category}
              capabilities={tool.capabilities}
              approvalStatus={tool.approvalStatus}
              dataHandling={tool.dataHandling}
              docsUrl={tool.docsUrl ?? undefined}
              limitations={tool.limitations ?? undefined}
              reviewedAt={tool.lastReviewedAt}
            />
          ))
        ) : (
          <EmptyState title="No tools found" description="Try adjusting your filters or search." />
        )}
      </div>

      {tools.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Approval statuses are verified catalogue entries. Data handling
            guidance is provided by the tool owner and should be reviewed before
            sharing sensitive information.
          </p>
        </div>
      )}
    </AppShell>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ToolsPageInner />
    </Suspense>
  );
}
