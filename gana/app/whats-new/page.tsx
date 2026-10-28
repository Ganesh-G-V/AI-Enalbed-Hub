import { db } from "@/server/db/client";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function WhatsNewPage() {
  const docs = await db.sourceDocument.findMany({
    where: { source: { provider: "openai" } },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { source: true },
  });

  return (
    <AppShell headerTitle="What's New" breadcrumbs={[{ label: "What's New", href: "/whats-new" }]}>
      <PageHeader title="What's New" description="External OpenAI News items." />
      <ul className="space-y-4">
        {docs.map((d) => (
          <li key={d.id} className="border rounded p-4">
            <a href={d.url} className="font-medium text-primary" target="_blank" rel="noreferrer">{d.title}</a>
            {d.publishedAt && <p className="text-xs text-muted-foreground">{d.publishedAt.toISOString()}</p>}
            {d.content && <p className="text-sm mt-2">{String(d.content).slice(0, 200)}</p>}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
