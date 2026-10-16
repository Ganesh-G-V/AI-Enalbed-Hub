export interface SourceConfig {
  [key: string]: unknown;
}

export interface SourceDocumentInput {
  externalId: string | null;
  title: string;
  url: string;
  content: string | null;
  contentHash: string | null;
  etag: string | null;
  lastModified: Date | null;
  publishedAt: Date | null;
  metadata: SourceConfig | null;
  rawPayload: SourceConfig | null;
}

export interface IngestResult {
  documents: SourceDocumentInput[];
  etag: string | null;
  contentHash: string | null;
  nextCursor: string | null;
  hasMore: boolean;
  errors: IngestionError[];
}

export interface IngestionError {
  message: string;
  code?: string;
  retryable: boolean;
}

export interface ConnectorHealth {
  status: "healthy" | "degraded" | "unhealthy";
  lastError?: string;
  lastChecked: Date;
  rateLimitRemaining?: number;
}

export interface SourceConnector {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly reliability: "verified" | "reputable" | "unverified";

  /**
   * Test connectivity to the source. Does not ingest data.
   */
  healthCheck(config: SourceConfig): Promise<ConnectorHealth>;

  /**
   * Ingest data from the source. Returns extracted documents and metadata.
   * Supports incremental ingestion via etag/lastModified/cursor.
   */
  ingest(config: SourceConfig, options?: {
    etag?: string | null;
    lastModified?: Date | null;
    cursor?: string | null;
  }): Promise<IngestResult>;

  /**
   * Normalize a raw source document into a canonical form.
   * Implementations should never throw for malformed data; return errors instead.
   */
  normalize(raw: unknown): Promise<SourceDocumentInput | IngestionError>;
}
