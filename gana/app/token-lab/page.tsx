"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormField } from "@/components/shared/FormField";
import { CostBreakdown } from "@/components/shared/CostBreakdown";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrencyValue, formatTokenCount } from "@/lib/formatting";

interface ModelPricing {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  version: number;
  inputRatePerMillion: number;
  outputRatePerMillion: number;
  cachedInputRatePerMillion: number | null;
  currency: string;
  source: string;
  assumptions: string;
  isIllustrative: boolean;
  isCurrent: boolean;
}

export default function TokenLabPage() {
  const [models, setModels] = React.useState<ModelPricing[]>([]);
  const [inputTokens, setInputTokens] = React.useState<string>("");
  const [outputTokens, setOutputTokens] = React.useState<string>("");
  const [cachedTokens, setCachedTokens] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [breakdown, setBreakdown] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch("/api/v1/admin/pricing")
      .then((res: any) => {
        const current = (res.items || []).filter((p: ModelPricing) => p.isCurrent);
        setModels(current);
        if (current.length > 0) setSelectedModel(current[0].modelId);
      })
      .catch(() => setError("Unable to load pricing data."));
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch("/api/v1/cost/estimate", {
        method: "POST",
        body: JSON.stringify({
          modelId: selectedModel,
          inputTokens: parseInt(inputTokens, 10) || 0,
          outputTokens: parseInt(outputTokens, 10) || 0,
          cachedTokens: parseInt(cachedTokens, 10) || 0,
        }),
      });
      setBreakdown(result);
    } catch (err: any) {
      setError(err.message ?? "Calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell headerTitle="Token & Cost Lab" breadcrumbs={[{ label: "Token & Cost Lab", href: "/token-lab" }]}>
      <DemoModeBanner />
      <SectionHeader title="Token & Cost Lab" description="Estimate AI token costs using current pricing profiles. These are illustrative estimates, not measured usage." />
      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <FormField label="Model" required>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.modelId}>
                    {m.modelName} ({m.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Input tokens">
            <Input type="number" value={inputTokens} onChange={(e) => setInputTokens(e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Output tokens">
            <Input type="number" value={outputTokens} onChange={(e) => setOutputTokens(e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Cached input tokens">
            <Input type="number" value={cachedTokens} onChange={(e) => setCachedTokens(e.target.value)} placeholder="0" />
          </FormField>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Calculating..." : "Calculate cost"}
        </Button>
      </form>

      {error && (
        <div className="p-3 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {breakdown && (
        <div className="mt-6 p-5 rounded-xl border border-border bg-background">
          <SectionHeader title="Cost Estimate" description="Illustrative estimate only — not actual provider usage." />
          <CostBreakdown
            inputTokens={breakdown.inputTokens}
            outputTokens={breakdown.outputTokens}
            cachedTokens={breakdown.cachedTokens}
            inputRate={breakdown.inputRate}
            outputRate={breakdown.outputRate}
            cachedRate={breakdown.cachedRate ?? undefined}
            currency={breakdown.currency}
          />
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>Model: {breakdown.model} ({breakdown.provider})</p>
            <p>Pricing version: {breakdown.version} (effective {breakdown.effectiveAt})</p>
            <p>Source: {breakdown.source}</p>
            <p className={breakdown.isIllustrative ? "text-warning-foreground" : "text-muted-foreground"}>
              {breakdown.isEstimate ? "⚠ No current pricing configured; costs are illustrative estimates." : "✓ Based on current pricing profile."}
            </p>
            <p>{breakdown.assumptions}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}


