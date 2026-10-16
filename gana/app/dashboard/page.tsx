export const dynamic = "force-dynamic";

import { db } from "@/server/db/client";
import { isDemoMode } from "@/server/env";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/shared/Badge";
import { AIUsageChart } from "@/components/charts/AIUsageChart";
import { CostTrendChart } from "@/components/charts/CostTrendChart";
import { UseCaseDistributionChart } from "@/components/charts/UseCaseDistributionChart";
import { DataTable } from "@/components/shared/DataTable";
import { formatRelativeDate } from "@/lib/formatting";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import Link from "next/link";

async function getStats() {
  const [tools, prompts, evalRuns, usage] = await Promise.all([
    db.tool.count(),
    db.promptTemplate.count({ where: { isPublished: true } }),
    db.evaluationRun.count(),
    db.usageEvent.count(),
  ]);
  return { tools, prompts, evalRuns, usage };
}

async function getUsageOverTime() {
  const rows = await db.usageEvent.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    _sum: { inputTokens: true, outputTokens: true },
    orderBy: { createdAt: "asc" },
    take: 30,
  });
  return rows.map((r) => ({
    name: new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    requests: r._count.id,
    tokens: Math.round(((r._sum.inputTokens ?? 0) + (r._sum.outputTokens ?? 0)) / 1000),
  }));
}

async function getCostTrend() {
  const rows = await db.usageEvent.groupBy({
    by: ["createdAt"],
    _sum: { estimatedCost: true },
    orderBy: { createdAt: "asc" },
    take: 30,
  });
  return rows.map((r) => ({
    name: new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    cost: Number(r._sum.estimatedCost ?? 0),
  }));
}

async function getUseCaseDistribution() {
  const rows = await db.usageEvent.groupBy({
    by: ["category"],
    _count: { id: true },
  });
  return rows
    .filter((r) => r.category)
    .map((r) => ({ name: String(r.category), value: r._count.id }));
}

async function getRecentPrompts() {
  return db.promptTemplate.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, category: true, updatedAt: true },
  });
}

async function getRecentEvaluations() {
  return db.evaluationRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { scenario: { select: { title: true } } },
  });
}

async function getMostUsedTools() {
  const rows = await db.usageEvent.groupBy({
    by: ["toolId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const ids = rows.map((r) => r.toolId).filter(Boolean) as string[];
  const tools = ids.length ? await db.tool.findMany({ where: { id: { in: ids } } }) : [];
  return rows.map((r) => {
    const tool = tools.find((t) => t.id === r.toolId);
    return { name: tool?.name ?? "Unknown", count: r._count.id };
  });
}

async function getKnowledgeUpdates() {
  return db.knowledgeDocument.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, category: true, reviewedAt: true },
  });
}

export default async function DashboardPage() {
  const [stats, usageOverTime, costTrend, useCaseDist, recentPrompts, recentEvaluations, mostUsedTools, knowledgeUpdates] =
    await Promise.all([
      getStats(),
      getUsageOverTime(),
      getCostTrend(),
      getUseCaseDistribution(),
      getRecentPrompts(),
      getRecentEvaluations(),
      getMostUsedTools(),
      getKnowledgeUpdates(),
    ]);
  const demo = isDemoMode();

  return (
    <AppShell
      headerTitle="Dashboard"
      headerDescription="Executive and developer overview of AI adoption, usage, and cost."
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }]}
    >
      <DemoModeBanner />
      <div className="grid gap-4 mb-6">
        <StatCard title="Available tools" value={stats.tools} subtitle="In catalogue" />
        <StatCard title="Published prompts" value={stats.prompts} subtitle="Ready to reuse" />
        <StatCard title="Evaluation runs" value={stats.evalRuns} subtitle="Completed" />
        <StatCard title="Recorded AI usage" value={stats.usage} subtitle="Requests (demo data)" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SectionCard title="AI usage over time" description="Requests and tokens recorded over time.">
            <AIUsageChart data={usageOverTime} />
          </SectionCard>
        </div>
        <div>
          <SectionCard title="Estimated cost trend" description="Estimated cost per period.">
            <CostTrendChart data={costTrend} />
          </SectionCard>
          <SectionCard title="Use case distribution" description="Share of usage by task category.">
            <UseCaseDistributionChart data={useCaseDist} />
          </SectionCard>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        <QuickActionCard title="Find an AI tool" description="Browse the approved tool catalogue." href="/tools" />
        <QuickActionCard title="Browse prompts" description="Search and copy prompt templates." href="/prompts" />
        <QuickActionCard title="Cost lab" description="Estimate token cost and compare models." href="/token-lab" />
        <QuickActionCard title="Knowledge Center" description="Read approved AI guidance." href="/knowledge" />
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Recent prompts" description="Most recently published prompt templates.">
            <DataTable
              columns={[
                { key: "title", header: "Title", render: (v: any) => <Link href={`/prompts/${v.id}`}>{v.title}</Link> },
                { key: "category", header: "Category" },
                { key: "updatedAt", header: "Updated", render: (v: any) => formatRelativeDate(v) },
              ]}
              data={recentPrompts}
              emptyMessage="No published prompts yet."
            />
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Recent evaluation results" description="Latest evaluation run outcomes.">
            <DataTable
              columns={[
                { key: "scenario.title", header: "Scenario", render: (v: any, row: any) => row.scenario?.title ?? v },
                { key: "status", header: "Status", render: (v: any) => <Badge variant="outline">{v}</Badge> },
                { key: "createdAt", header: "Run at", render: (v: any) => formatRelativeDate(v) },
              ]}
              data={recentEvaluations}
              emptyMessage="No evaluation runs yet."
            />
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Most-used tools" description="Tools with the most recorded usage events.">
            <DataTable
              columns={[
                { key: "name", header: "Tool" },
                { key: "count", header: "Uses", render: (v: any) => <span className="tabular-nums">{v}</span> },
              ]}
              data={mostUsedTools}
              emptyMessage="No usage recorded yet."
            />
          </SectionCard>
        </div>
        <div className="lg:col-span-2">
          <SectionCard title="Latest knowledge updates" description="Recently reviewed guidance documents.">
            <DataTable
              columns={[
                { key: "title", header: "Title", render: (v: any) => <Link href={`/knowledge/${v.id}`}>{v.title}</Link> },
                { key: "category", header: "Category" },
                { key: "reviewedAt", header: "Reviewed", render: (v: any) => (v ? formatRelativeDate(v) : "—") },
              ]}
              data={knowledgeUpdates}
              emptyMessage="No knowledge documents yet."
            />
          </SectionCard>
        </div>
      </div>

      <div className="mt-6">
        <SectionCard title="Recommended AI practices" description="Approved practices for responsible AI adoption.">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Treat AI-generated code as a draft; review before merging.</li>
            <li>Never paste secrets, API keys, or customer PII into AI tools.</li>
            <li>Confirm a tool is approved for your data classification before use.</li>
            <li>Measure cost per successful task, not tokens alone.</li>
            <li>Validate AI outputs against authoritative sources.</li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function SectionCard({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function QuickActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
