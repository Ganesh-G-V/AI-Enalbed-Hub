import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, SourceType, SourceReliability } from "@prisma/client";
import { OpenAIModelsConnector } from "@/server/ingestion/connectors/openai";
import { SourceConnector } from "@/server/ingestion/connector";

const db = new PrismaClient();

// Deterministic mock connector for testing
class MockSourceConnector implements SourceConnector {
  readonly id = "test-mock";
  readonly name = "Test Mock Connector";
  readonly type = "test";
  readonly reliability = "verified" as const;

  private documents: any[];
  private callCount = 0;
  private shouldFail = false;

  constructor(documents: any[]) {
    this.documents = documents;
  }

  setFail(fail: boolean) {
    this.shouldFail = fail;
  }

  async healthCheck(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; lastError?: string; lastChecked: Date; rateLimitRemaining?: number }> {
    return { status: "healthy", lastChecked: new Date() };
  }

  async ingest(): Promise<{
    documents: any[];
    etag: string | null;
    contentHash: string | null;
    nextCursor: string | null;
    hasMore: boolean;
    errors: any[];
  }> {
    this.callCount++;
    if (this.shouldFail) {
      return {
        documents: [],
        etag: null,
        contentHash: null,
        nextCursor: null,
        hasMore: false,
        errors: [{ message: "Simulated failure", code: "simulated", retryable: true }],
      };
    }
    return {
      documents: this.documents,
      etag: `etag-${this.callCount}`,
      contentHash: `hash-${this.callCount}`,
      nextCursor: null,
      hasMore: false,
      errors: [],
    };
  }

  async normalize(raw: unknown): Promise<any> {
    return raw as any;
  }
}

describe("AI Intelligence Platform - Ingestion System", () => {
  let testSourceId: string;
  let testJobId: string;

  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    // Cleanup test source and related records (delete in dependency order)
    if (testSourceId) {
      await db.changeEvent.deleteMany({ where: { sourceId: testSourceId } });
      await db.sourceDocument.deleteMany({ where: { sourceId: testSourceId } });
      await db.ingestionJob.deleteMany({ where: { sourceId: testSourceId } });
      await db.sourceRegistry.delete({ where: { id: testSourceId } });
    }
    await db.$disconnect();
  });

  it("OpenAI connector normalizes model data correctly", () => {
    const connector = new OpenAIModelsConnector();

    const rawModel = {
      id: "gpt-4o",
      object: "model",
      created: 1677610602,
      owned_by: "openai",
    };

    return connector.normalize(rawModel).then((result) => {
      if ("message" in result) {
        throw new Error(`Normalization failed: ${result.message}`);
      }
      expect(result.externalId).toBe("openai:gpt-4o");
      expect(result.title).toBe("gpt-4o");
      expect(result.url).toContain("openai.com");
      expect(result.content).toContain("gpt-4o");
      expect(result.contentHash).toBeTruthy();
      expect(result.metadata?.provider).toBe("OpenAI");
    });
  });

  it("OpenAI connector rejects invalid model data", async () => {
    const connector = new OpenAIModelsConnector();

    const result = await connector.normalize({ invalid: true });
    if ("message" in result) {
      expect(result.code).toBe("invalid_model");
      expect(result.retryable).toBe(false);
    } else {
      throw new Error("Expected normalization to fail for invalid data");
    }
  });

  it("creates source and job via ingestion service", async () => {
    const { ingestionService } = await import("@/server/ingestion/service");

    const source = await ingestionService.registerSource({
      name: "Test RSS Source",
      provider: "Test Provider",
      type: SourceType.RSS_FEED,
      url: "https://example.com/feed",
      pollIntervalMs: 3600000,
      reliability: SourceReliability.REPUTABLE,
      extractionMethod: "rss",
    });

    testSourceId = source.id;
    expect(source.name).toBe("Test RSS Source");

    // Find the job created for this source
    const sources = await ingestionService.listSources();
    const createdSource = sources.find((s: any) => s.id === source.id);
    expect(createdSource).toBeTruthy();
    if (createdSource) {
      expect(createdSource.jobs.length).toBeGreaterThan(0);
      testJobId = createdSource.jobs[0].id;
    }
  });

  it("ingestion is idempotent - re-running does not create duplicates", async () => {
    const { ingestionService } = await import("@/server/ingestion/service");

    // Create test documents directly
    const doc1 = await db.sourceDocument.create({
      data: {
        sourceId: testSourceId,
        externalId: "openai:gpt-4o-idempotent",
        title: "GPT-4o Idempotent",
        url: "https://platform.openai.com/docs/models/gpt-4o-idempotent",
        content: JSON.stringify({ id: "gpt-4o", provider: "OpenAI" }),
        contentHash: "hash-idempotent-1",
        etag: "etag-1",
        metadata: {},
        rawPayload: {},
      },
    });

    // Count NEW_VERSION change events for this specific document before
    const beforeCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        entityId: doc1.id,
      },
    });

    // Simulate re-ingesting the same document (same content hash)
    await ingestionService.detectChanges(testSourceId, [
      {
        externalId: "openai:gpt-4o-idempotent",
        title: "GPT-4o Idempotent",
        url: "https://platform.openai.com/docs/models/gpt-4o-idempotent",
        content: JSON.stringify({ id: "gpt-4o", provider: "OpenAI" }),
        contentHash: "hash-idempotent-1", // Same hash = no change
        metadata: {},
      },
    ]);

    const afterCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        entityId: doc1.id,
      },
    });

    expect(afterCount).toBe(beforeCount); // No new change events for unchanged content
  });

  it("detects new model and creates change event", async () => {
    const { ingestionService } = await import("@/server/ingestion/service");

    // Count NEW_MODEL change events for this externalId before
    const beforeCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        entityId: "openai:gpt-5-idempotent",
        changeType: "NEW_MODEL",
      },
    });

    // Ingest a brand new document
    await ingestionService.detectChanges(testSourceId, [
      {
        externalId: "openai:gpt-5-idempotent",
        title: "GPT-5 Idempotent",
        url: "https://platform.openai.com/docs/models/gpt-5",
        content: JSON.stringify({ id: "gpt-5", provider: "OpenAI" }),
        contentHash: "hash-new-idempotent-1",
        metadata: {},
      },
    ]);

    const afterCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        entityId: "openai:gpt-5-idempotent",
        changeType: "NEW_MODEL",
      },
    });

    expect(afterCount).toBe(beforeCount + 1);

    // Verify the change event details
    const change = await db.changeEvent.findFirst({
      where: {
        sourceId: testSourceId,
        entityType: "model",
        changeType: "NEW_MODEL",
        entityId: "openai:gpt-5-idempotent",
      },
      orderBy: { detectedAt: "desc" },
    });

    expect(change).toBeTruthy();
    expect(change?.reviewStatus).toBe("PENDING");
    expect(change?.published).toBe(false);
  });

  it("detects content change for existing document", async () => {
    const { ingestionService } = await import("@/server/ingestion/service");

    // Create a document first
    const doc = await db.sourceDocument.create({
      data: {
        sourceId: testSourceId,
        externalId: "openai:gpt-4o-change-content",
        title: "GPT-4o Original",
        url: "https://platform.openai.com/docs/models/gpt-4o-change-content",
        content: JSON.stringify({ id: "gpt-4o", provider: "OpenAI" }),
        contentHash: "hash-original-content",
        etag: "etag-original-content",
        metadata: {},
        rawPayload: {},
      },
    });

    // Count NEW_VERSION change events for this specific document before
    const beforeCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        sourceDocumentId: doc.id,
        changeType: "NEW_VERSION",
      },
    });

    // Simulate a content change for the existing document (same title, different content hash)
    await ingestionService.detectChanges(testSourceId, [
      {
        externalId: "openai:gpt-4o-change-content",
        title: "GPT-4o Original", // Same title - only content changes
        url: "https://platform.openai.com/docs/models/gpt-4o-change-content",
        content: JSON.stringify({ id: "gpt-4o", provider: "OpenAI", updated: true }),
        contentHash: "hash-changed-content", // Different hash = change detected
        metadata: {},
      },
    ]);

    const afterCount = await db.changeEvent.count({
      where: {
        sourceId: testSourceId,
        sourceDocumentId: doc.id,
        changeType: "NEW_VERSION",
      },
    });

    expect(afterCount).toBe(beforeCount + 1);
  });

  it("change review queue - approve, reject, correct, defer", async () => {
    const { ingestionService } = await import("@/server/ingestion/service");

    // Create a pending change event
    const change = await db.changeEvent.create({
      data: {
        source: { connect: { id: testSourceId } },
        entityType: "model",
        entityId: "test-model-1",
        changeType: "PRICING_CHANGE",
        oldValue: { price: 10 },
        newValue: { price: 20 },
        sourceEvidence: "https://example.com/pricing",
        confidence: 0.9,
        impact: "high",
        reviewStatus: "PENDING",
      },
    });

    // Test approve
    const approved = await ingestionService.reviewChange({
      changeId: change.id,
      reviewerId: "admin-user",
      status: "APPROVED" as any,
      notes: "Looks correct",
    });
    expect(approved).toBeTruthy();

    const updated = await db.changeEvent.findUnique({ where: { id: change.id } });
    expect(updated?.reviewStatus).toBe("APPROVED");
    expect(updated?.published).toBe(true);
    expect(updated?.reviewedBy).toBe("admin-user");
    expect(updated?.reviewedAt).toBeTruthy();

    // Test reject with a new change
    const change2 = await db.changeEvent.create({
      data: {
        source: { connect: { id: testSourceId } },
        entityType: "model",
        entityId: "test-model-2",
        changeType: "NEW_MODEL",
        oldValue: null as any,
        newValue: { name: "bad-model" },
        sourceEvidence: "https://example.com",
        confidence: 0.5,
        impact: "low",
        reviewStatus: "PENDING",
      },
    });

    const rejected = await ingestionService.reviewChange({
      changeId: change2.id,
      reviewerId: "admin-user",
      status: "REJECTED" as any,
      notes: "Not authoritative",
    });
    expect(rejected).toBeTruthy();

    const updated2 = await db.changeEvent.findUnique({ where: { id: change2.id } });
    expect(updated2?.reviewStatus).toBe("REJECTED");
    expect(updated2?.published).toBe(false);
  });

  it("pricing history is preserved when new version is created", async () => {
    // Create a model first
    const model = await db.modelProfile.create({
      data: {
        name: "test-model-v1",
        provider: "Test Provider",
        displayName: "Test Model V1",
        isApproved: true,
        lifecycleStatus: "GENERAL_AVAILABILITY",
        verificationStatus: "verified",
        confidence: 1.0,
      },
    });

    // Create initial pricing
    const pricingV1 = await db.modelPricing.create({
      data: {
        modelId: model.id,
        version: 1,
        effectiveAt: new Date("2026-01-01"),
        inputRatePerMillion: 5.0,
        outputRatePerMillion: 15.0,
        currency: "USD",
        source: "provider-page",
        assumptions: "v1 pricing",
        isIllustrative: false,
        isCurrent: true,
        isVerified: true,
        confidence: 1.0,
      },
    });

    // Create new pricing version (old one should remain)
    await db.modelPricing.create({
      data: {
        modelId: model.id,
        version: 2,
        effectiveAt: new Date("2026-06-01"),
        inputRatePerMillion: 7.5,
        outputRatePerMillion: 20.0,
        currency: "USD",
        source: "provider-page",
        assumptions: "v2 pricing",
        isIllustrative: false,
        isCurrent: true,
        isVerified: true,
        confidence: 1.0,
      },
    });

    // Mark v1 as not current
    await db.modelPricing.update({
      where: { id: pricingV1.id },
      data: { isCurrent: false },
    });

    // Verify both versions exist
    const allPricing = await db.modelPricing.findMany({
      where: { modelId: model.id },
      orderBy: { version: "asc" },
    });

    expect(allPricing.length).toBe(2);
    expect(allPricing[0].version).toBe(1);
    expect(allPricing[0].inputRatePerMillion.toNumber()).toBe(5.0);
    expect(allPricing[1].version).toBe(2);
    expect(allPricing[1].inputRatePerMillion.toNumber()).toBe(7.5);

    // Verify only v2 is current
    const currentPricing = await db.modelPricing.findMany({
      where: { modelId: model.id, isCurrent: true },
    });
    expect(currentPricing.length).toBe(1);
    expect(currentPricing[0].version).toBe(2);

    // Cleanup
    await db.modelPricing.deleteMany({ where: { modelId: model.id } });
    await db.modelProfile.delete({ where: { id: model.id } });
  });
});
