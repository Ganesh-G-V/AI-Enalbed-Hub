import { PrismaClient } from "@prisma/client";
import { describe, it, expect } from "vitest";

const db = new PrismaClient();

describe("pricing import persistence", () => {
  it("has model profiles", async () => {
    const count = await db.modelProfile.count();
    expect(count).toBeGreaterThan(0);
  });
});
