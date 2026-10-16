"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/FormField";
import { SelectField } from "@/components/shared/SelectField";
import { Badge } from "@/components/shared/Badge";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { apiFetch } from "@/lib/api-client";
import { ChevronRight, Check, ArrowRight, ShieldAlert, Info } from "lucide-react";

const TASKS = [
  { value: "coding", label: "Coding" },
  { value: "debugging", label: "Debugging" },
  { value: "testing", label: "Testing" },
  { value: "code_review", label: "Code review" },
  { value: "architecture", label: "Architecture" },
  { value: "data_analysis", label: "Data analysis" },
  { value: "sql", label: "SQL" },
  { value: "documentation", label: "Documentation" },
  { value: "research", label: "Research" },
  { value: "summarization", label: "Summarization" },
  { value: "knowledge_retrieval", label: "Knowledge retrieval" },
  { value: "customer_support", label: "Customer support" },
];

const ROLES = [
  { value: "developer", label: "Developer" },
  { value: "qa_engineer", label: "QA engineer" },
  { value: "data_analyst", label: "Data analyst" },
  { value: "architect", label: "Architect" },
  { value: "tech_lead", label: "Technical lead" },
  { value: "product_manager", label: "Product manager" },
];

const CLASSIFICATIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "RESTRICTED", label: "Restricted" },
];

const PREFERENCES = [
  { value: "lowest_cost", label: "Lowest cost" },
  { value: "balanced", label: "Balanced" },
  { value: "highest_capability", label: "Highest capability" },
  { value: "lowest_latency", label: "Lowest latency" },
];

const STEPS = ["Task", "Role", "Description", "Data sensitivity", "Preferences", "Results"];

export default function RecommendWizard() {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    taskCategory: "",
    role: "",
    description: "",
    dataClassification: "",
    preference: "balanced",
  });
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const isLastStep = step === STEPS.length - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/recommendations", {
        method: "POST",
        body: JSON.stringify({ ...form, taskCategory: form.taskCategory.toUpperCase() }),
      });
      setResult(res);
      setStep(STEPS.length - 1);
    } catch (err: any) {
      setError(err.message || "Recommendation failed.");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep(0);
    setResult(null);
    setError("");
  };

  return (
    <AppShell
      headerTitle="AI Recommendation Wizard"
      headerDescription="Get a tool recommendation for your task, role, and data sensitivity."
      breadcrumbs={[{ label: "AI Hub", href: "/dashboard" }, { label: "Recommendation", href: "/tools/recommend" }]}
    >
      <div className="max-w-2xl">
        <PageHeader title="AI Recommendation Wizard" description="Select your task, role, and data sensitivity to get a recommended tool." />
        {!isLastStep ? (
          <WizardStep step={step} total={STEPS.length} label={STEPS[step]} />
        ) : null}

        {!isLastStep ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 && (
              <FormField label="What is your task?" required>
                <SelectField
                  label="Task category"
                  name="taskCategory"
                  value={form.taskCategory || null}
                  onValueChange={(v) => setForm({ ...form, taskCategory: v ?? "" })}
                  items={TASKS}
                  required
                />
              </FormField>
            )}
            {step === 1 && (
              <FormField label="What is your role?" required>
                <SelectField
                  label="Employee role"
                  name="role"
                  value={form.role || null}
                  onValueChange={(v) => setForm({ ...form, role: v ?? "" })}
                  items={ROLES}
                  required
                />
              </FormField>
            )}
            {step === 2 && (
              <FormField label="Describe your task" required hint="Be concise — what are you trying to accomplish?">
                <textarea
                  className="w-full h-32 rounded-lg border border-border bg-background p-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
            )}
            {step === 3 && (
              <FormField label="Data sensitivity level" required>
                <SelectField
                  label="Data classification"
                  name="dataClassification"
                  value={form.dataClassification || null}
                  onValueChange={(v) => setForm({ ...form, dataClassification: v ?? "" })}
                  items={CLASSIFICATIONS}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We will never recommend sending {form.dataClassification.charAt(0).toUpperCase() + form.dataClassification.slice(1)} data to a tool not approved for that classification.
                </p>
              </FormField>
            )}
            {step === 4 && (
              <FormField label="Your preference">
                <SelectField
                  label="Preference"
                  name="preference"
                  value={form.preference || null}
                  onValueChange={(v) => setForm({ ...form, preference: v ?? "balanced" })}
                  items={PREFERENCES}
                />
              </FormField>
            )}
            <CardFooter className="flex justify-between gap-2 pt-4">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowRight className="-mr-1 size-4 rotate-180" /> Back
                </Button>
              )}
              <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length - 1}</span>
              <Button
                type="submit"
                disabled={loading || !form.taskCategory || !form.role || (step === 2 && !form.description) || (step === 3 && !form.dataClassification)}
                className="w-auto"
              >
                {loading ? "Loading…" : step === STEPS.length - 2 ? "Get recommendation" : "Next"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <ResultsView result={result} onRestart={restart} error={error} form={form} />
        )}
      </div>
    </AppShell>
  );
}

function WizardStep({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>Step {step + 1} of {total - 1}: {label}</span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 h-1 rounded-full overflow-hidden">
            <div
              className={`
                h-full transition-all duration-300 ${
                  i < step ? "bg-primary" : i === step ? "bg-primary/40" : "bg-muted"
                }
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({ result, onRestart, error, form }: { result: any; onRestart: () => void; error: string; form: any }) {
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 size-5 text-destructive" />
          <div>
            <h3 className="text-sm font-semibold text-destructive">No eligible recommendation</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recommended tools</h2>
        <Button onClick={onRestart} variant="outline" size="sm">
          <ArrowRight className="mr-1 size-4 rotate-180" /> Start over
        </Button>
      </div>

      {!result?.eligible?.length ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">No eligible tool found</h3>
          <p className="text-sm text-destructive/80 mt-1">
            No approved tool matches this task and data classification combination.
          </p>
          <div className="mt-3 space-y-1 text-sm text-foreground">
            <p><strong>Alternatives:</strong></p>
            <ul className="list-disc pl-5 text-destructive/80">
              {result?.alternatives?.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {result.eligible.map((t: any, i: number) => (
            <RecommendationCard
              key={i}
              toolName={t.name}
              provider={t.provider}
              category={t.category}
              fitReason={t.fitReason}
              cost={t.cost}
              latency={t.latency}
              warnings={t.warnings ?? []}
            />
          ))}
        </div>
      )}

      {result?.warnings?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Data handling warnings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-warning-foreground space-y-1 list-disc pl-5">
              {result.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Verification checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            {result.verificationChecklist.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {result?.relatedPrompts?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Related prompts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {result.relatedPrompts.map((p: any, i: number) => (
                <Link key={i} href={`/prompts/${p.id}`} className="text-sm text-primary underline underline-offset-4">
                  {p.title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
