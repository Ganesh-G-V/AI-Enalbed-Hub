import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrencyValue, formatTokenCount, formatPercent } from "@/lib/formatting";

interface AnalyticsSummary {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  byType: Array<{ dataType: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byModel: Array<{ provider: string; model: string; count: number }>;
  isSeeded: boolean;
}

async function fetchAnalytics(): Promise<AnalyticsSummary> {
  return apiFetch("/api/v1/analytics/summary");
}

export default async function AnalyticsPage() {
  let data: AnalyticsSummary;
  try {
    data = await fetchAnalytics();
  } catch {
    data = {
      totalRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      byType: [],
      byCategory: [],
      byModel: [],
      isSeeded: true,
    };
  }

  return (
    <AppShell headerTitle="Analytics" breadcrumbs={[{ label: "Analytics", href: "/analytics" }]}>
      <DemoModeBanner />
      <SectionHeader title="Analytics" description="Usage and cost analytics for AI tool adoption." />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total requests" value={data.totalRequests.toLocaleString()} change="0" />
        <StatCard title="Input tokens" value={formatTokenCount(data.inputTokens)} change="0" />
        <StatCard title="Output tokens" value={formatTokenCount(data.outputTokens)} change="0" />
        <StatCard title="Estimated cost" value={formatCurrencyValue(data.estimatedCost)} change="0" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-5 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground mb-3">Data by type</h3>
          <div className="space-y-2">
            {data.byType.map((t) => (
              <div key={t.dataType} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.dataType}</span>
                <span className="font-mono text-foreground">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground mb-3">Usage by category</h3>
          <div className="space-y-2">
            {data.byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.category}</span>
                <span className="font-mono text-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground mb-3">Usage by model</h3>
          <div className="space-y-2">
            {data.byModel.map((m) => (
              <div key={`${m.provider}:${m.model}`} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{m.provider} · {m.model}</span>
                <span className="font-mono text-foreground">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {data.isSeeded && (
        <div className="mt-4 p-3 rounded-lg border border-warning/20 bg-warning/5 text-warning-foreground text-sm">
          Displaying seeded sample data. Metrics are illustrative and do not represent actual organizational usage.
        </div>
      )}
    </AppShell>
  );
}
