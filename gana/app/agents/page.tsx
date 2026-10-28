import { db } from "@/server/db/client";

export default async function AgentsPage() {
  const products = await db.agentProduct.findMany({
    include: { capabilities: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Agents &amp; IDEs</h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">No agents registered.</p>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="rounded border p-4">
              <h2 className="font-medium">{p.name} — {p.provider}</h2>
              <p className="text-sm text-muted-foreground">Status: {p.approvalStatus} · Verified: {p.verificationStatus}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {p.capabilities.map((c) => (
                  <li key={c.id}>{c.name}: {c.description}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
