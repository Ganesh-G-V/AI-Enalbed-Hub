import { PrismaClient } from "@prisma/client";
import { describe, it, expect } from "vitest";

const db = new PrismaClient();

describe("whats new data", () => {
  it("has persisted openai news docs", async () => {
    const count = await db.sourceDocument.count({ where: { source: { provider: "openai" } } });
    expect(count).toBeGreaterThan(0);
  });
});
