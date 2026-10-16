import { db } from "@/server/db/client";
import { Prisma, TaskCategory, DataClassification, UsageDataType } from "@prisma/client";

export interface UsageEventInput {
  userId: string;
  toolId?: string | null;
  modelId?: string | null;
  category?: string | null;
  dataClassification?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  estimatedCost?: number;
  actualCost?: number | null;
  currency?: string;
  dataType: UsageDataType;
  latencyMs?: number | null;
  provider?: string | null;
  requestId?: string | null;
  success?: boolean;
}

export class UsageService {
  async record(input: UsageEventInput) {
    return db.usageEvent.create({
      data: {
        userId: input.userId,
        toolId: input.toolId ?? null,
        modelId: input.modelId ?? null,
        category: input.category as TaskCategory | undefined,
        dataClassification: input.dataClassification as DataClassification | undefined,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        cachedTokens: input.cachedTokens ?? 0,
        estimatedCost: new Prisma.Decimal(input.estimatedCost ?? 0),
        actualCost: input.actualCost != null ? new Prisma.Decimal(input.actualCost) : null,
        currency: input.currency ?? "USD",
        dataType: input.dataType,
        latencyMs: input.latencyMs ?? null,
        provider: input.provider ?? null,
        requestId: input.requestId ?? null,
        success: input.success ?? true,
      },
    });
  }

  async summary({ userId, startDate, endDate }: { userId?: string; startDate?: Date; endDate?: Date }) {
    const where: Prisma.UsageEventScalarWhereInput = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byType, byCategory] = await Promise.all([
      db.usageEvent.count({ where }),
      db.usageEvent.groupBy({
        by: ["dataType"],
        where,
        _count: { id: true },
      }),
      db.usageEvent.groupBy({
        by: ["category"],
        where: { ...where, category: { not: null } },
        _count: { id: true },
        _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
      }),
    ]);

    return { total, byType, byCategory };
  }
}

export const usageService = new UsageService();
