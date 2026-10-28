import { NextRequest } from "next/server";
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/v1/pricing/import/route";
import { db } from "@/server/db/client";

describe("pricing import route", () => {
  it("rejects unauthenticated/non-admin", async () => {
    const req = new NextRequest("http://localhost/api/v1/pricing/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ records: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects invalid payload", async () => {
    const req = new NextRequest("http://localhost/api/v1/pricing/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "admin", "x-user-role": "admin" },
      body: JSON.stringify({ records: [{ modelId: "x" }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects malformed source URL", async () => {
    const models = await db.modelProfile.findMany({ take: 1 });
    if (models.length === 0) return;
    const req = new NextRequest("http://localhost/api/v1/pricing/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "admin", "x-user-role": "admin" },
      body: JSON.stringify({ records: [{ modelId: models[0].id, inputRatePerMillion: 1, outputRatePerMillion: 2, source: "not-a-url" }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
