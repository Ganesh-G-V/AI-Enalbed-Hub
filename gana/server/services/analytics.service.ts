import { db } from "@/server/db/client";
import { UsageDataType } from "@prisma/client";

export interface AnalyticsSummary {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  byType: Array<{ dataType: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byModel: Array<{ provider: string; model: string; count: number }>;
  isSeeded: boolean;
}

export class AnalyticsService {
  async summary({ userId, startDate, endDate }: { userId?: string; startDate?: Date; endDate?: Date }): Promise<AnalyticsSummary> {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }

    const [totalRequests, byType, byCategory, byModel, costAgg] = await Promise.all([
      db.usageEvent.count({ where }),
      db.usageEvent.groupBy({ by: ["dataType"], where, _count: { id: true } }),
      db.usageEvent.groupBy({
        by: ["category"],
        where: { ...where, category: { not: null } },
        _count: { id: true },
      }),
      db.usageEvent.groupBy({
        by: ["provider", "modelId"],
        where: { ...where, provider: { not: null } },
        _count: { id: true },
      }),
      db.usageEvent.aggregate({
        where,
        _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
      }),
    ]);

    const inputTokens = costAgg._sum.inputTokens ?? 0;
    const outputTokens = costAgg._sum.outputTokens ?? 0;
    const estimatedCost = Number(costAgg._sum.estimatedCost ?? 0);

    // Mark whether results are seeded/demo data.
    const seededCount = byType.find((b) => b.dataType === UsageDataType.SEEDED)?._count.id ?? 0;
    const isSeeded = seededCount > 0 && totalRequests === seededCount;

    return {
      totalRequests,
      inputTokens,
      outputTokens,
      estimatedCost,
      byType: byType.map((b) => ({ dataType: b.dataType, count: b._count.id })),
      byCategory: byCategory.map((b) => ({ category: b.category ?? "uncategorized", count: b._count.id })),
      byModel: byModel.map((b) => ({ provider: b.provider ?? "unknown", model: b.modelId ?? "unknown", count: b._count.id })),
      isSeeded,
    };
  }
}

export const analyticsService = new AnalyticsService();
