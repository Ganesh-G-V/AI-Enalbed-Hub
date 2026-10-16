import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll } from "vitest";

const db = new PrismaClient();

describe("database seed", () => {
  beforeAll(async () => {
    await db.$connect();
  });

  it("has seeded tools", async () => {
    const count = await db.tool.count();
    expect(count).toBeGreaterThan(0);
  });

  it("has seeded prompts", async () => {
    const count = await db.promptTemplate.count({ where: { isPublished: true } });
    expect(count).toBeGreaterThan(0);
  });

  it("has seeded knowledge documents", async () => {
    const count = await db.knowledgeDocument.count({ where: { isPublished: true } });
    expect(count).toBeGreaterThan(0);
  });

  it("has seeded evaluation scenarios", async () => {
    const count = await db.evaluationScenario.count();
    expect(count).toBeGreaterThan(0);
  });

  it("has versioned illustrative pricing", async () => {
    const count = await db.modelPricing.count({ where: { isIllustrative: true } });
    expect(count).toBeGreaterThan(0);
  });

  it("usage events are marked seeded", async () => {
    const count = await db.usageEvent.count({ where: { dataType: "SEEDED" } });
    expect(count).toBeGreaterThan(0);
  });
});
