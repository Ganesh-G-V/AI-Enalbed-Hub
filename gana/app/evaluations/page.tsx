import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/shared/Badge";
import { formatDate } from "@/lib/formatting";

interface EvaluationScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  input: string;
  expectedOutcome: string | null;
  rubric: string;
  isAutomated: boolean;
  isSample: boolean;
  updatedAt: Date;
}

interface EvaluationRun {
  id: string;
  scenarioId: string;
  status: string;
  qualityScore: number | null;
  passFail: boolean | null;
  createdAt: Date;
  scenario: EvaluationScenario;
}

async function fetchScenarios(): Promise<EvaluationScenario[]> {
  return apiFetch("/api/v1/evaluations/scenarios");
}

export default async function EvaluationsPage() {
  let scenarios: EvaluationScenario[] = [];
  try {
    scenarios = await fetchScenarios();
  } catch {
    scenarios = [];
  }

  return (
    <AppShell headerTitle="Evaluation Lab" breadcrumbs={[{ label: "Evaluation Lab", href: "/evaluations" }]}>
      <DemoModeBanner />
      <SectionHeader title="Evaluation Lab" description="Run and review evaluation scenarios for AI models and prompts." />
      {scenarios.length === 0 ? (
        <EmptyState title="No evaluation scenarios" description="No scenarios found." />
      ) : (
        <div className="card p-5 border border-border rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-muted-foreground">Title</th>
                <th className="pb-2 text-muted-foreground">Category</th>
                <th className="pb-2 text-muted-foreground">Automated</th>
                <th className="pb-2 text-muted-foreground">Type</th>
                <th className="pb-2 text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-muted">
                  <td className="py-3 text-foreground">{s.title}</td>
                  <td className="py-3 text-muted-foreground">{s.category}</td>
                  <td className="py-3">
                    <Badge variant={s.isAutomated ? "default" : "outline"} className="text-[0.7rem]">
                      {s.isAutomated ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.isSample ? "Sample" : "Custom"}</td>
                  <td className="py-3 text-muted-foreground">{formatDate(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
