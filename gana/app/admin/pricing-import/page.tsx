"use client";

import React from "react";
import Papa from "papaparse";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

const EXAMPLE = JSON.stringify({
  records: [
    {
      modelId: "REPLACE_WITH_MODEL_ID",
      inputRatePerMillion: 2.5,
      outputRatePerMillion: 10,
      currency: "USD",
      source: "https://example.com/pricing",
    },
  ],
}, null, 2);

export default function PricingImportPage() {
  const [text, setText] = React.useState(EXAMPLE);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  function parseCSV(text: string) {
    const res = Papa.parse(text, { header: true, skipEmptyLines: true });
    return res.data as any[];
  }

  async function submitCSV(file: File) {
    const txt = await file.text();
    const rows = parseCSV(txt);
    setText(JSON.stringify({ records: rows }, null, 2));
  }

  async function submit() {
    setError(null);
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError("Invalid JSON: " + (e as Error).message);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/pricing/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "admin", "x-user-role": "admin" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(JSON.stringify(data));
      } else {
        setResult(data);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell headerTitle="Pricing Import" breadcrumbs={[{ label: "Pricing Import", href: "/admin/pricing-import" }]}>
      <PageHeader title="Pricing Import" description="Import pricing records as JSON." />
      <textarea className="w-full h-64 border rounded p-2 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-2"><input type="file" accept=".csv" onChange={(e) => e.target.files && submitCSV(e.target.files[0])} /></div>
      <div className="mt-4">
        <Button onClick={submit} disabled={loading}>{loading ? "Importing..." : "Import"}</Button>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {result && (
        <pre className="mt-4 bg-muted p-4 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </AppShell>
  );
}
