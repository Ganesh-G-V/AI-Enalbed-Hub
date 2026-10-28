import { XMLParser } from "fast-xml-parser";
import { SourceConnector, SourceConfig, SourceDocumentInput, IngestResult, IngestionError, ConnectorHealth } from "../connector";

export class OpenAIWhatsNewConnector implements SourceConnector {
  readonly id = "openai-whatsnew";
  readonly name = "OpenAI News RSS";
  readonly type = "rss";
  readonly reliability = "reputable" as const;

  private url = "https://openai.com/news/rss.xml";

  async healthCheck(_config: SourceConfig): Promise<ConnectorHealth> {
    try {
      const res = await fetch(this.url, { signal: AbortSignal.timeout(10000) });
      return { status: res.ok ? "healthy" : "degraded", lastChecked: new Date() };
    } catch (e) {
      return { status: "unhealthy", lastError: String(e), lastChecked: new Date() };
    }
  }

  async ingest(_config: SourceConfig): Promise<IngestResult> {
    const errors: IngestionError[] = [];
    try {
      const res = await fetch(this.url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        return { documents: [], etag: null, contentHash: null, nextCursor: null, hasMore: false, errors: [{ message: `HTTP ${res.status}`, code: "http", retryable: true }] };
      }
      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? [];
      const arr = Array.isArray(items) ? items : [items];
      const documents: SourceDocumentInput[] = arr.map((it: any) => ({
        externalId: it.guid?.["#text"] ?? it.guid ?? it.link ?? null,
        title: String(it.title ?? ""),
        url: String(it.link ?? ""),
        content: it.description ?? null,
        contentHash: null,
        etag: null,
        lastModified: null,
        publishedAt: it.pubDate ? new Date(it.pubDate) : null,
        metadata: { provider: "openai" },
        rawPayload: it,
      }));
      return { documents, etag: null, contentHash: null, nextCursor: null, hasMore: false, errors };
    } catch (e) {
      return { documents: [], etag: null, contentHash: null, nextCursor: null, hasMore: false, errors: [{ message: String(e), code: "parse", retryable: false }] };
    }
  }

  async normalize(raw: unknown): Promise<SourceDocumentInput | IngestionError> {
    return { message: "not supported", retryable: false } as any;
  }
}
