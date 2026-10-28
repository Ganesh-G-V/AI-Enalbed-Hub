/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma Json types require any casts for dynamic data */
import { db } from "@/server/db/client";
import { SourceConnector } from "./connector";
import { OpenAIModelsConnector } from "./connectors/openai";
import { OpenAIPricingConnector } from "./connectors/pricing";
import { OpenAIWhatsNewConnector } from "./connectors/whatsnew";
import { IngestionStatus, SourceType, SourceReliability, ChangeType, ChangeReviewStatus } from "@prisma/client";

// Connector registry - add new connectors here
const CONNECTORS: Record<string, () => SourceConnector> = {
  "PROVIDER_API": () => new OpenAIModelsConnector(),
  "RSS_FEED": () => new OpenAIWhatsNewConnector(),
};

export function getConnector(sourceType: string): SourceConnector | null {
  const factory = CONNECTORS[sourceType];
  if (!factory) return null;
  return factory();
}

export interface SyncOptions {
  sourceId: string;
  force?: boolean;
}

export class IngestionService {
  /**
   * Register a new source in the registry.
   */
  async registerSource(data: {
    name: string;
    provider: string;
    type: SourceType;
    url: string;
    config?: SourceConfig;
    authSecretRef?: string | null;
    pollIntervalMs?: number;
    reliability?: SourceReliability;
    extractionMethod?: string;
  }): Promise<{ id: string; name: string }> {
    // Validate connector can be instantiated if it's a provider API source
    if (data.type === SourceType.PROVIDER_API) {
      const connectorName = data.name.toLowerCase().includes("openai") ? "openai-models" : "";
      const connector = getConnector(connectorName);
      if (connector) {
        const health = await connector.healthCheck(data.config ?? {});
        if (health.status === "unhealthy" && !data.authSecretRef) {
          // Don't fail registration, just note it
        }
      }
    }

    const source = await db.sourceRegistry.create({
      data: {
        name: data.name,
        provider: data.provider,
        type: data.type,
        url: data.url,
        config: (data.config ?? {}) as unknown as any,
        authSecretRef: data.authSecretRef ?? null,
        pollIntervalMs: data.pollIntervalMs ?? 3600000,
        reliability: data.reliability ?? SourceReliability.UNVERIFIED,
        extractionMethod: data.extractionMethod ?? "api",
        nextScheduledSync: new Date(Date.now() + (data.pollIntervalMs ?? 3600000)),
      },
    });

    // Create an ingestion job for this source
    await db.ingestionJob.create({
      data: {
        sourceId: source.id,
        name: `Sync ${source.name}`,
        cron: "0 */1 * * *", // hourly by default
        enabled: true,
        nextRunAt: new Date(Date.now() + (data.pollIntervalMs ?? 3600000)),
      },
    });

    return { id: source.id, name: source.name };
  }

  /**
   * List all sources with their health status.
   */
  async listSources() {
    return db.sourceRegistry.findMany({
      include: {
        jobs: {
          include: {
            runs: {
              orderBy: { startedAt: "desc" },
              take: 1,
            },
          },
        },
        _count: {
          select: { documents: true, changeEvents: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Update a source's configuration.
   */
  async updateSource(id: string, data: {
    name?: string;
    enabled?: boolean;
    pollIntervalMs?: number;
    reliability?: SourceReliability;
    config?: SourceConfig;
  }): Promise<{ id: string } | null> {
    const source = await db.sourceRegistry.update({
      where: { id },
      data: {
        name: data.name,
        enabled: data.enabled,
        pollIntervalMs: data.pollIntervalMs,
        reliability: data.reliability,
        config: (data.config ?? {}) as unknown as any,
        updatedAt: new Date(),
      },
    });

    // Update the associated job's schedule
    await db.ingestionJob.updateMany({
      where: { sourceId: id },
      data: {
        enabled: data.enabled ?? undefined,
      },
    });

    return { id: source.id };
  }

  /**
   * Manually trigger a sync for a source.
   */
  async syncSource(sourceId: string): Promise<{ runId: string; status: string }> {
    const source = await db.sourceRegistry.findUnique({
      where: { id: sourceId },
      include: { jobs: { take: 1 } },
    });

    if (!source) throw new Error("Source not found");
    if (!source.enabled) throw new Error("Source is disabled");

    const job = source.jobs[0];
    if (!job) throw new Error("No ingestion job found for source");

    return this.runIngestionJob(job.id);
  }

  /**
   * Run an ingestion job execution.
   */
  async runIngestionJob(jobId: string): Promise<{ runId: string; status: string }> {
    const job = await db.ingestionJob.findUnique({
      where: { id: jobId },
      include: { source: true },
    });

    if (!job) throw new Error("Job not found");

    const run = await db.ingestionRun.create({
      data: {
        jobId,
        status: IngestionStatus.RUNNING,
        startedAt: new Date(),
        retryAttempt: 0,
      },
    });

    // Execute ingestion asynchronously (fire and forget - the run record tracks status)
    this.executeIngestion(run.id, job).catch((err) => {
      console.error(`[Ingestion] Job ${jobId} run ${run.id} failed:`, err);
    });

    return { runId: run.id, status: run.status };
  }

  private async executeIngestion(runId: string, job: any): Promise<void> {
    const connector = getConnector(job.source.type);
    if (!connector) {
      await this.failRun(runId, "no_connector", `No connector registered for source type ${job.source.type}`);
      return;
    }

    const maxRetries = job.maxRetries;
    const backoffBaseMs = job.backoffBaseMs;

    let lastError: Error | null = null;
    let retryAttempt = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      retryAttempt = attempt;
      try {
        await this.executeSingleIngestion(runId, job, connector, attempt);
        return; // success
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Ingestion] Run ${runId} attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          const delay = Math.min(backoffBaseMs * Math.pow(2, attempt), 30000);
          await this.sleep(delay);
          await db.ingestionRun.update({
            where: { id: runId },
            data: { retryAttempt: attempt + 1 },
          });
        }
      }
    }

    await this.failRun(runId, "max_retries_exceeded", lastError?.message ?? "Unknown error", retryAttempt);
  }

  private async executeSingleIngestion(
    runId: string,
    job: any,
    connector: SourceConnector,
    _attempt: number
  ): Promise<void> {
    const start = Date.now();

    // Get the last run's etag for incremental ingestion
    const lastRun = await db.ingestionRun.findFirst({
      where: { jobId: job.id, id: { not: runId }, status: IngestionStatus.COMPLETED },
      orderBy: { completedAt: "desc" },
      take: 1,
    });

    const result = await connector.ingest(
      { apiKey: job.source.config?.apiKey ?? null },
      {
        etag: lastRun?.etag ?? null,
        lastModified: lastRun?.completedAt ?? undefined,
      }
    );

    // Handle errors from the connector
    if (result.errors.length > 0) {
      const nonRetryableErrors = result.errors.filter((e) => !e.retryable);
      if (nonRetryableErrors.length > 0 && result.documents.length === 0) {
        throw new Error(nonRetryableErrors.map((e) => e.message).join("; "));
      }
    }

    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsSkipped = 0;

    for (const doc of result.documents) {
      const existing = await db.sourceDocument.findFirst({
        where: {
          sourceId: job.sourceId,
          externalId: doc.externalId ?? undefined,
        },
      });

      if (existing) {
        // Idempotent: only update if content hash changed
        if (existing.contentHash !== doc.contentHash) {
          await db.sourceDocument.update({
            where: { id: existing.id },
            data: {
              title: doc.title,
              url: doc.url,
              content: doc.content,
              contentHash: doc.contentHash,
              etag: doc.etag,
              lastModified: doc.lastModified,
              publishedAt: doc.publishedAt,
              metadata: (doc.metadata ?? null) as any,
              rawPayload: (doc.rawPayload ?? null) as any,
              retrievedAt: new Date(),
            },
          });
          itemsUpdated++;
        } else {
          itemsSkipped++;
        }
      } else {
        await db.sourceDocument.create({
          data: {
            sourceId: job.sourceId,
            externalId: doc.externalId ?? null,
            title: doc.title,
            url: doc.url,
            content: doc.content,
            contentHash: doc.contentHash,
            etag: doc.etag ?? null,
            lastModified: doc.lastModified ?? null,
            publishedAt: doc.publishedAt ?? null,
            metadata: (doc.metadata ?? null) as any,
            rawPayload: (doc.rawPayload ?? null) as any,
          },
        });
        itemsInserted++;
      }
    }

    // Detect and record changes for updated/new documents
    try {
      await this.detectChanges(job.sourceId, result.documents);
    } catch (err: unknown) {
      // Change detection failures should not fail the whole ingestion run
      console.error(`[Ingestion] Change detection failed for run ${runId}:`, err);
    }

    const durationMs = Date.now() - start;

    await db.ingestionRun.update({
      where: { id: runId },
      data: {
        status: IngestionStatus.COMPLETED,
        completedAt: new Date(),
        durationMs,
        itemsProcessed: result.documents.length,
        itemsInserted,
        itemsUpdated,
        itemsSkipped,
        etag: result.etag,
        contentHash: result.contentHash,
        logs: {
          ingestedAt: new Date().toISOString(),
          connector: connector.id,
          source: job.source.name,
          errors: result.errors.length,
        },
      },
    });

    // Update source sync timestamps
    await db.sourceRegistry.update({
      where: { id: job.sourceId },
      data: {
        lastSuccessfulSync: new Date(),
        lastAttemptedSync: new Date(),
        nextScheduledSync: new Date(Date.now() + job.pollIntervalMs),
        errorCount: 0,
        health: "healthy",
      },
    });

    // Update job next run
    await db.ingestionJob.update({
      where: { id: job.id },
      data: {
        lastRunId: runId,
        nextRunAt: new Date(Date.now() + job.pollIntervalMs),
      },
    });
  }

  private async failRun(
    runId: string,
    errorCode: string,
    errorMessage: string,
    retryAttempt: number = 0
  ): Promise<void> {
    await db.ingestionRun.update({
      where: { id: runId },
      data: {
        status: IngestionStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
        errorCode,
        retryAttempt,
        logs: {
          failedAt: new Date().toISOString(),
          errorCode,
          errorMessage,
        },
      },
    });

    // Update source error count
    const run = await db.ingestionRun.findUnique({
      where: { id: runId },
      include: { job: { include: { source: true } } },
    });

    if (run?.job?.source) {
      await db.sourceRegistry.update({
        where: { id: run.job.sourceId },
        data: {
          lastAttemptedSync: new Date(),
          errorCount: { increment: 1 },
          health: "degraded",
        },
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get run history for a job.
   */
  async getRunHistory(jobId: string, { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
    return db.ingestionRun.findMany({
      where: { jobId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startedAt: "desc" },
    });
  }

  /**
   * Get pending change events for review.
   */
  async getPendingChanges({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
    const [items, total] = await Promise.all([
      db.changeEvent.findMany({
        where: { reviewStatus: ChangeReviewStatus.PENDING },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { detectedAt: "desc" },
        include: { source: true, document: true },
      }),
      db.changeEvent.count({ where: { reviewStatus: ChangeReviewStatus.PENDING } }),
    ]);
    return { items, total };
  }

  /**
   * Review a change event (approve, reject, correct, defer).
   */
  async reviewChange(data: {
    changeId: string;
    reviewerId: string;
    status: ChangeReviewStatus;
    notes?: string | null;
    correctedValue?: unknown;
  }): Promise<{ id: string } | null> {
    const updateData: any = {
      reviewStatus: data.status,
      reviewedBy: data.reviewerId,
      reviewedAt: new Date(),
      reviewNotes: data.notes ?? null,
    };

    if (data.status === ChangeReviewStatus.CORRECTED && data.correctedValue !== undefined) {
      updateData.newValue = data.correctedValue;
    }

    if (data.status === ChangeReviewStatus.APPROVED) {
      updateData.published = true;
    }

    const change = await db.changeEvent.update({
      where: { id: data.changeId },
      data: updateData,
    });

    // If approved and it's a model change, update the model record
    if (data.status === ChangeReviewStatus.APPROVED && change.entityType === "model") {
      await this.applyModelChange(change);
    }

    return { id: change.id };
  }

  private async applyModelChange(change: any): Promise<void> {
    // Apply approved changes to model profiles, pricing, etc.
    // This is where verified data gets committed to the public-facing models
    if (change.newValue && change.entityId) {
      try {
        if (change.changeType === ChangeType.NEW_MODEL || change.changeType === ChangeType.NEW_VERSION) {
          await db.modelProfile.upsert({
            where: { id: change.entityId },
            update: change.newValue as any,
            create: change.newValue as any,
          });
        } else if (change.changeType === ChangeType.PRICING_CHANGE) {
          // Pricing changes are applied by creating a new version
          // The change event itself is the record; pricing is applied via admin approval
        }
      } catch (err) {
        console.error(`[Ingestion] Failed to apply change ${change.id}:`, err);
      }
    }
  }

  /**
   * Detect changes between new and existing data, creating ChangeEvent records.
   * This is called after ingestion to identify what changed.
   */
  async detectChanges(sourceId: string, documents: any[]): Promise<number> {
    let count = 0;

    for (const doc of documents) {
      const existing = await db.sourceDocument.findFirst({
        where: { sourceId, externalId: doc.externalId ?? undefined },
      });

      if (!existing) {
        // Brand new document - record as a new model/entity change
        await db.changeEvent.create({
          data: {
            sourceId,
            sourceDocumentId: null,
            entityType: "model",
            entityId: doc.externalId ?? doc.title,
            changeType: ChangeType.NEW_MODEL,
            oldValue: null as any,
            newValue: {
              title: doc.title,
              url: doc.url,
              metadata: doc.metadata as any,
            },
            sourceEvidence: doc.url,
            confidence: 0.8,
            impact: "medium",
            reviewStatus: ChangeReviewStatus.PENDING,
            previousVerifiedValue: null as any,
          },
        });
        count++;
        continue;
      }

      // Compare key fields for existing documents
      const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

      if (existing.title !== doc.title) {
        changes.push({ field: "title", oldValue: existing.title, newValue: doc.title });
      }
      if (existing.contentHash !== doc.contentHash) {
        changes.push({ field: "content", oldValue: existing.contentHash, newValue: doc.contentHash });
      }

      for (const change of changes) {
        await db.changeEvent.create({
          data: {
            sourceId,
            sourceDocumentId: existing.id,
            entityType: "source_document",
            entityId: existing.id,
            changeType: ChangeType.NEW_VERSION,
            oldValue: { [change.field]: change.oldValue } as any,
            newValue: { [change.field]: change.newValue } as any,
            diff: `${change.field} changed`,
            sourceEvidence: doc.url,
            confidence: 0.9,
            impact: "medium",
            reviewStatus: ChangeReviewStatus.PENDING,
            previousVerifiedValue: { [change.field]: change.oldValue } as any,
          },
        });
        count++;
      }
    }

    return count;
  }
}

export const ingestionService = new IngestionService();

// Type for config passed to connectors
type SourceConfig = Record<string, unknown>;
