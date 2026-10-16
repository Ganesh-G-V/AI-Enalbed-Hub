import { db } from "@/server/db/client";

export interface KnowledgeFilters {
  category?: string;
  search?: string;
  role?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  sourceUrl: string | null;
  version: string | null;
  reviewedAt: Date | null;
  relevance: number;
  excerpt: string;
}

export class KnowledgeService {
  async list(filters: KnowledgeFilters, { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
    const where: Record<string, unknown> = { isPublished: true };
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { content: { contains: filters.search, mode: "insensitive" } },
        { tags: { has: filters.search } },
      ];
    }
    if (filters.role) where.roleAccess = { has: filters.role };

    const [docs, total] = await Promise.all([
      db.knowledgeDocument.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, title: true, category: true, summary: true,
          sourceUrl: true, version: true, reviewedAt: true,
          isSample: true, tags: true, updatedAt: true,
        },
      }),
      db.knowledgeDocument.count({ where }),
    ]);
    return { documents: docs, total };
  }

  async getById(id: string) {
    return db.knowledgeDocument.findUnique({ where: { id } });
  }

  /**
   * Keyword relevance search over approved documents. Returns a bounded set of
   * relevant excerpts with a relevance score. No vector DB required.
   */
  async search(query: string, role: string, limit = 5): Promise<SearchResult[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const docs = await db.knowledgeDocument.findMany({
      where: {
        isPublished: true,
        roleAccess: { has: role },
      },
      select: {
        id: true, title: true, category: true, content: true,
        summary: true, sourceUrl: true, version: true,
        reviewedAt: true, isSample: true,
      },
    });

    const scored = docs.map((doc) => {
      const contentLower = doc.content.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      let score = 0;
      let excerpt = "";
      for (const term of terms) {
        const titleMatches = (titleLower.match(new RegExp(term, "g")) || []).length;
        const contentMatches = (contentLower.match(new RegExp(term, "g")) || []).length;
        score += titleMatches * 3 + contentMatches * 1;
      }
      if (score === 0) return null;
      // Build an excerpt around the first matched term.
      const firstTerm = terms[0];
      const idx = contentLower.indexOf(firstTerm);
      if (idx !== -1) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(doc.content.length, idx + 160);
        excerpt = `...${doc.content.slice(start, end)}...`;
      } else {
        excerpt = doc.content.slice(0, 200) + "...";
      }
      return { ...doc, relevance: score, excerpt };
    }).filter(Boolean) as SearchResult[];

    scored.sort((a, b) => b.relevance - a.relevance);
    return scored.slice(0, limit);
  }

  async create(data: {
    title: string;
    category: string;
    content: string;
    summary?: string | null;
    sourceUrl?: string | null;
    version: string;
    reviewedAt?: Date | null;
    nextReviewAt?: Date | null;
    isPublished: boolean;
    isSample: boolean;
    roleAccess: string[];
    tags: string[];
  }) {
    return db.knowledgeDocument.create({
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
        summary: data.summary ?? null,
        sourceUrl: data.sourceUrl ?? null,
        version: data.version,
        reviewedAt: data.reviewedAt ?? null,
        nextReviewAt: data.nextReviewAt ?? null,
        isPublished: data.isPublished,
        isSample: data.isSample,
        roleAccess: data.roleAccess,
        tags: data.tags,
      },
    });
  }

  async update(id: string, data: Partial<{
    title: string;
    category: string;
    content: string;
    summary: string | null;
    sourceUrl: string | null;
    version: string;
    reviewedAt: Date | null;
    nextReviewAt: Date | null;
    isPublished: boolean;
    isSample: boolean;
    roleAccess: string[];
    tags: string[];
  }>) {
    return db.knowledgeDocument.update({ where: { id }, data });
  }
}

export const knowledgeService = new KnowledgeService();
