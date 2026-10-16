import { SourceConnector, SourceConfig, SourceDocumentInput, IngestResult, IngestionError, ConnectorHealth } from "../connector";

export class OpenAIModelsConnector implements SourceConnector {
  readonly id = "openai-models";
  readonly name = "OpenAI Models API";
  readonly type = "provider_api";
  readonly reliability = "verified" as const;

  private async fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(config: SourceConfig): Promise<ConnectorHealth> {
    const apiKey = String(config.apiKey ?? "");
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    try {
      const res = await this.fetchWithTimeout(
        "https://api.openai.com/v1/models",
        headers,
        10000
      );

      if (res.status === 401) {
        return {
          status: "unhealthy",
          lastError: "Unauthorized: invalid or missing API key",
          lastChecked: new Date(),
        };
      }
      if (!res.ok) {
        return {
          status: "degraded",
          lastError: `HTTP ${res.status}`,
          lastChecked: new Date(),
        };
      }
      const rateLimitRemaining = res.headers.get("x-ratelimit-remaining-requests");
      return {
        status: "healthy",
        lastChecked: new Date(),
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
      };
    } catch (err: unknown) {
      return {
        status: "unhealthy",
        lastError: err instanceof Error ? err.message : String(err),
        lastChecked: new Date(),
      };
    }
  }

  async ingest(config: SourceConfig, options?: {
    etag?: string | null;
    lastModified?: Date | null;
    cursor?: string | null;
  }): Promise<IngestResult> {
    const apiKey = String(config.apiKey ?? "");
    const errors: IngestionError[] = [];

    if (!apiKey) {
      return {
        documents: [],
        etag: null,
        contentHash: null,
        nextCursor: null,
        hasMore: false,
        errors: [{ message: "OpenAI API key not configured", code: "missing_api_key", retryable: false }],
      };
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
    };

    if (options?.etag) headers["If-None-Match"] = options.etag;
    if (options?.lastModified) headers["If-Modified-Since"] = options.lastModified.toUTCString();

    try {
      const res = await this.fetchWithTimeout(
        "https://api.openai.com/v1/models",
        headers,
        30000
      );

      // 304 Not Modified - no changes
      if (res.status === 304) {
        return {
          documents: [],
          etag: res.headers.get("etag") ?? null,
          contentHash: null,
          nextCursor: null,
          hasMore: false,
          errors: [],
        };
      }

      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500;
        return {
          documents: [],
          etag: res.headers.get("etag") ?? null,
          contentHash: null,
          nextCursor: null,
          hasMore: false,
          errors: [{ message: `OpenAI API returned ${res.status}`, code: String(res.status), retryable }],
        };
      }

      const etag = res.headers.get("etag") ?? null;
      const body = await res.json();

      if (!body || !Array.isArray(body.data)) {
        return {
          documents: [],
          etag,
          contentHash: null,
          nextCursor: null,
          hasMore: false,
          errors: [{ message: "Unexpected response format from OpenAI API", code: "invalid_response", retryable: false }],
        };
      }

      const documents: SourceDocumentInput[] = [];
      for (const model of body.data) {
        const normalized = await this.normalize(model);
        if ("message" in normalized) {
          errors.push(normalized);
        } else {
          documents.push(normalized);
        }
      }

      // Compute a content hash from the etag and document count for change detection
      const contentHash = etag
        ? Buffer.from(`${etag}:${documents.length}`).toString("base64").slice(0, 32)
        : null;

      return {
        documents,
        etag,
        contentHash,
        nextCursor: null,
        hasMore: false,
        errors,
      };
    } catch (err: unknown) {
      return {
        documents: [],
        etag: null,
        contentHash: null,
        nextCursor: null,
        hasMore: false,
        errors: [{ message: err instanceof Error ? err.message : String(err), code: "fetch_error", retryable: true }],
      };
    }
  }

  async normalize(raw: unknown): Promise<SourceDocumentInput | IngestionError> {
    try {
      const model = raw as { id: string; object: string; created: number; owned_by: string };

      if (!model || typeof model.id !== "string") {
        return { message: "Model missing id field", code: "invalid_model", retryable: false };
      }

      const externalId = `openai:${model.id}`;
      const title = model.id;
      const url = `https://platform.openai.com/docs/models/${model.id}`;
      const created = model.created ? new Date(model.created * 1000) : null;

      // Extract capabilities from model ID patterns (heuristic, flagged as unverified)
      const capabilities = this.extractCapabilities(model.id);
      const contextWindow = this.extractContextWindow(model.id);

      const content = JSON.stringify({
        id: model.id,
        object: model.object,
        created: model.created,
        ownedBy: model.owned_by,
        capabilities,
        contextWindow,
        source: "openai_api",
        retrievedAt: new Date().toISOString(),
      }, null, 2);

      const contentHash = Buffer.from(content).toString("base64").slice(0, 32);

      return {
        externalId,
        title,
        url,
        content,
        contentHash,
        etag: null, // OpenAI doesn't return per-item etags
        lastModified: created,
        publishedAt: created,
        metadata: {
          provider: "OpenAI",
          ownedBy: model.owned_by,
          capabilities,
          contextWindow,
          extractionMethod: "api_heuristic",
          reliability: "unverified",
        },
        rawPayload: model,
      };
    } catch (err: unknown) {
      return { message: err instanceof Error ? err.message : String(err), code: "normalize_error", retryable: false };
    }
  }

  private extractCapabilities(modelId: string): string[] {
    const caps: string[] = [];
    const lower = modelId.toLowerCase();
    if (lower.includes("gpt-4") || lower.includes("o1") || lower.includes("o3")) caps.push("text_generation");
    if (lower.includes("code")) caps.push("code_generation");
    if (lower.includes("vision") || lower.includes("vl")) caps.push("image_understanding");
    if (lower.includes("audio")) caps.push("audio_processing");
    if (lower.includes("tts")) caps.push("text_to_speech");
    if (lower.includes("whisper")) caps.push("speech_to_text");
    if (lower.includes("embedding")) caps.push("embeddings");
    if (caps.length === 0) caps.push("text_generation");
    return caps;
  }

  private extractContextWindow(modelId: string): number | null {
    const lower = modelId.toLowerCase();
    const known: Record<string, number> = {
      "gpt-4o": 128000,
      "gpt-4o-mini": 128000,
      "gpt-4-turbo": 128000,
      "gpt-4": 8192,
      "gpt-3.5-turbo": 16385,
      "o1-preview": 128000,
      "o1-mini": 128000,
      "text-embedding-3-small": 8192,
      "text-embedding-3-large": 8192,
    };
    for (const [key, value] of Object.entries(known)) {
      if (lower.includes(key)) return value;
    }
    return null;
  }
}
