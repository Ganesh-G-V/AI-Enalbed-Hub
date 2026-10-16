import { apiFetch } from "@/lib/api-client";
import { DemoModeBanner } from "@/components/shared/DemoModeBanner";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/formatting";

interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

interface AuditEvent {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: { id: string; email: string | null; name: string | null } | null;
}

async function fetchSettings(): Promise<AppSetting[]> {
  return apiFetch("/api/v1/admin/settings");
}

async function fetchAudit(page: number = 1, pageSize: number = 50): Promise<{ events: AuditEvent[]; total: number }> {
  return apiFetch(`/api/v1/admin/audit?page=${page}&pageSize=${pageSize}`);
}

export default async function AdminPage() {
  let settings: AppSetting[] = [];
  let audit: { events: AuditEvent[]; total: number } = { events: [], total: 0 };
  try {
    settings = await fetchSettings();
    audit = await fetchAudit();
  } catch {
    settings = [];
    audit = { events: [], total: 0 };
  }

  return (
    <AppShell headerTitle="Admin Settings" breadcrumbs={[{ label: "Admin Settings", href: "/admin" }]}>
      <DemoModeBanner />
      <SectionHeader title="Admin Settings" description="Manage application settings, pricing, and audit events." />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground mb-4">Application settings</h3>
          {settings.length === 0 ? (
            <EmptyState title="No settings" description="No application settings configured." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-muted-foreground">Key</th>
                  <th className="pb-2 text-muted-foreground">Value</th>
                  <th className="pb-2 text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key} className="border-b border-border hover:bg-muted">
                    <td className="py-3 font-mono text-muted-foreground">{s.key}</td>
                    <td className="py-3 text-foreground">{s.value}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(s.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card p-5 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground mb-4">Recent audit events</h3>
          {audit.events.length === 0 ? (
            <EmptyState title="No audit events" description="No audit events recorded." />
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-muted-foreground">Action</th>
                  <th className="pb-2 text-muted-foreground">Target</th>
                  <th className="pb-2 text-muted-foreground">Actor</th>
                  <th className="pb-2 text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {audit.events.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 font-mono text-muted-foreground">{e.action}</td>
                    <td className="py-3 text-muted-foreground">{e.targetType}:{e.targetId}</td>
                    <td className="py-3 text-muted-foreground">{e.actor?.email ?? "system"}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
