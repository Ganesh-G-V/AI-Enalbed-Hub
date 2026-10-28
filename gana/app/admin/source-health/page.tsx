"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

interface Source { id: string; name: string; type: string; enabled: boolean; health: string; lastSuccessfulSync?: string | null; lastAttemptedSync?: string | null; errorCount?: number; }

export default function SourceHealthPage() {
  const [sources, setSources] = React.useState<Source[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/sources", { headers: { "x-user-id": "admin", "x-user-role": "admin" } });
      const data = await res.json();
      setSources(data.items || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function sync(id: string) {
    setSyncing(id);
    try {
      await fetch(`/api/v1/sources/${id}/sync`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": "admin", "x-user-role": "admin" }, body: JSON.stringify({ force: "true" }) });
      await load();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <AppShell headerTitle="Source Health" breadcrumbs={[{ label: "Source Health", href: "/admin/source-health" }]}>
      <PageHeader title="Source Health" description="Source sync status." />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{s.name} ({s.type})</p>
              <p className="text-sm text-muted-foreground">Health: {s.health} · Last sync: {s.lastSuccessfulSync || "never"}</p>
            </div>
            <Button onClick={() => sync(s.id)} disabled={syncing === s.id}>{syncing === s.id ? "Syncing..." : "Sync Now"}</Button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
