"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PromptCard } from "@/components/shared/PromptCard";
import { SearchInput } from "@/components/shared/SearchInput";
import { SelectField } from "@/components/shared/SelectField";
import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { CopyButton } from "@/components/shared/CopyButton";
import { apiFetch } from "@/lib/api-client";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const CATEGORY_OPTIONS = [
  { value: "CODING", label: "Coding" },
  { value: "DEBUGGING", label: "Debugging" },
  { value: "REFACTORING", label: "Refactoring" },
  { value: "UNIT_TESTING", label: "Unit testing" },
  { value: "CODE_REVIEW", label: "Code review" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "SQL_AND_DATA_ANALYSIS", label: "SQL & data analysis" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "INCIDENT_ANALYSIS", label: "Incident analysis" },
  { value: "REQUIREMENTS_ANALYSIS", label: "Requirements analysis" },
  { value: "RESEARCH_AND_SUMMARIZATION", label: "Research & summarization" },
];

function PromptsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prompts, setPrompts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const category = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";

  const demo = document.documentElement.dataset.demoMode === "true";

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (q) qs.set("search", q);
      if (tag) qs.set("tag", tag);
      const data = await apiFetch(`/api/v1/prompts?page=1&pageSize=100${qs.toString() ? "&" + qs.toString() : ""}`);
      setPrompts(data.items);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [category, q, tag]);

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
      headerTitle="Prompt Library"
      headerDescription="Searchable, filterable library of approved prompt templates."
      breadcrumbs={[{ label: "AI Hub", href: "/dashboard" }, { label: "Prompt Library", href: "/prompts" }]}
    >
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={q}
            onChange={(v) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("q", v);
              router.push(`${pathname}?${params.toString()}`);
            }}
            placeholder="Search prompts by title or description"
          />
          <SelectField
            label="Category"
            name="category"
            value={category || null}
            onValueChange={(v) => setFilter("category", v ?? "")}
            items={CATEGORY_OPTIONS.map((v) => ({ value: v.value, label: v.label }))}
          />
          <SelectField
            label="Tag"
            name="tag"
            value={tag || null}
            onValueChange={(v) => setFilter("tag", v ?? "")}
            items={[
              { value: "unit-testing", label: "Unit testing" },
              { value: "code-explanation", label: "Code explanation" },
              { value: "security", label: "Security" },
              { value: "sql", label: "SQL" },
              { value: "architecture", label: "Architecture" },
            ].map((v) => ({ value: v.value, label: v.label }))}
          />
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground mt-2">Loading…</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} matched.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.length > 0 ? (
          prompts.map((p) => (
            <PromptCard
              key={p.id}
              id={p.id}
              title={p.title}
              category={p.category}
              description={p.description}
              role={p.applicableRole}
              difficulty={p.difficulty as any}
              tags={p.tags}
              onCopy={() => {
                navigator.clipboard.writeText(p.template ?? "");
              }}
              isFavorite={false}
            />
          ))
        ) : (
          <EmptyState title="No prompts found" description="Try adjusting your filters or search." />
        )}
      </div>

      {openId && (
        <PromptDetail prompt={prompts.find((p) => p.id === openId)} onClose={() => setOpenId(null)} />
      )}
    </AppShell>
  );
}

function PromptDetail({ prompt, onClose }: { prompt: any; onClose: () => void }) {
  const variables = React.useMemo(() => {
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const vars = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(prompt?.template || "")) !== null) vars.add(m[1]);
    return Array.from(vars);
  }, [prompt?.template]);

  if (!prompt) return null;

  return (
    <Dialog open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader>
          <DialogTitle>{prompt.title}</DialogTitle>
          <DialogDescription>{prompt.description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{prompt.category}</Badge>
          <Badge variant="outline">{prompt.difficulty}</Badge>
          <Badge variant="secondary">{prompt.applicableRole}</Badge>
          {prompt.tags.map((t: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-[0.7rem] px-2 py-1">{t}</Badge>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Prompt template</h3>
            <CodeBlock code={prompt.template || ""} language="text" copyable />
          </div>
          {variables.length && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Input variables</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Substitute these placeholders before use: {variables.join(", ")}
              </p>
              {prompt.exampleInput && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground">Example input</h4>
                  <CodeBlock code={prompt.exampleInput} language="text" copyable />
                </div>
              )}
            </div>
          )}
          {prompt.exampleOutput && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Example output</h3>
              <CodeBlock code={prompt.exampleOutput} language="text" copyable />
            </div>
          )}
          {prompt.instructions && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Instructions</h3>
              <p className="text-sm text-foreground">{prompt.instructions}</p>
            </div>
          )}
          {prompt.expectedOutputFormat && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Expected output format</h3>
              <p className="text-sm text-foreground">{prompt.expectedOutputFormat}</p>
            </div>
          )}
          {prompt.commonFailureModes && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Common failure modes</h3>
              <p className="text-sm text-foreground">{prompt.commonFailureModes}</p>
            </div>
          )}
          {prompt.qualityChecklist && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Quality checklist</h3>
              <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                {prompt.qualityChecklist.split("\n").filter(Boolean).map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PromptsPageInner />
    </Suspense>
  );
}
