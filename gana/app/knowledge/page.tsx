import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/shared/Badge";
import { formatDate } from "@/lib/formatting";
import { KnowledgeControls } from "@/components/shared/KnowledgeControls";
import { Suspense } from "react";

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  sourceUrl: string | null;
  version: string | null;
  reviewedAt: Date | null;
  isSample: boolean;
  tags: string[];
  updatedAt: Date;
}

interface KnowledgeListResponse {
  documents: KnowledgeDoc[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

async function fetchKnowledge(page: number = 1, pageSize: number = 20, search?: string): Promise<KnowledgeListResponse> {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (search) qs.set("search", search);
  return apiFetch(`/api/v1/knowledge?${qs.toString()}`);
}

export default async function KnowledgePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const page = parseInt(String(searchParams.page ?? "1"), 10) || 1;
  const q = String(searchParams.q ?? "");
  let data: KnowledgeListResponse;
  try {
    data = await fetchKnowledge(page, 20, q);
  } catch {
    data = { documents: [], total: 0, page, pageSize: 20, pageCount: 0 };
  }

  return (
    <AppShell headerTitle="Knowledge Center" breadcrumbs={[{ label: "Knowledge Center", href: "/knowledge" }]}>
      <DemoModeBanner />
      <SectionHeader title="Knowledge Center" description="Published guidance documents for AI tool usage and governance." />
      <Suspense fallback={<div className="h-8 animate-pulse rounded-full bg-muted" />}>
        <KnowledgeControls page={page} q={q} total={data.total} pageSize={20} />
      </Suspense>
      {data.documents.length === 0 ? (
        <EmptyState title="No knowledge documents" description="No published documents found." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.documents.map((doc) => (
            <div key={doc.id} className="card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground">{doc.title}</h3>
                <Badge variant="outline" className="text-[0.7rem]">{doc.isSample ? "Sample" : "Published"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{doc.summary ?? doc.category}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <span>{doc.category}</span>
                {doc.version && <span>v{doc.version}</span>}
              </div>
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[0.7rem] px-2 py-1">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="text-[0.75rem] text-muted-foreground">
                {doc.reviewedAt ? `Reviewed ${formatDate(doc.reviewedAt)}` : "Not yet reviewed"}
              </div>
              {doc.sourceUrl && (
                <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-primary hover:underline block">
                  View source →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
