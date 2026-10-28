import { SourceConnector, SourceConfig, SourceDocumentInput, IngestResult, IngestionError, ConnectorHealth } from "../connector";

export class OpenAIPricingConnector implements SourceConnector {
  readonly id = "openai-pricing";
  readonly name = "OpenAI Pricing (admin import)";
  readonly type = "pricing";
  readonly reliability = "verified" as const;

  async healthCheck(_config: SourceConfig): Promise<ConnectorHealth> {
    return { status: "degraded", lastError: "No automated pricing API; admin import required", lastChecked: new Date() };
  }

  async ingest(_config: SourceConfig): Promise<IngestResult> {
    return { documents: [], etag: null, contentHash: null, nextCursor: null, hasMore: false, errors: [{ message: "Automated pricing ingestion not available; use admin import", code: "not_implemented", retryable: false }] };
  }

  async normalize(raw: unknown): Promise<SourceDocumentInput | IngestionError> {
    return { message: "not supported", retryable: false };
  }
}
