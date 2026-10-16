import { db } from "@/server/db/client";
import { Tool, ApprovalStatus, TaskCategory, DataClassification } from "@prisma/client";

export interface ToolFilters {
  category?: TaskCategory;
  approvalStatus?: ApprovalStatus;
  dataClassification?: DataClassification;
  capability?: string;
  search?: string;
}

export interface ListToolsResult {
  tools: Tool[];
  total: number;
}

export class ToolsService {
  async list(filters: ToolFilters, { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}): Promise<ListToolsResult> {
    const where: Record<string, unknown> = { isCatalogueEntry: true };
    if (filters.category) where.category = filters.category;
    if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { provider: { contains: filters.search, mode: "insensitive" } },
        { capabilities: { has: filters.search } },
      ];
    }
    if (filters.capability) {
      where.capabilities = { has: filters.capability };
    }

    const [tools, total] = await Promise.all([
      db.tool.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.tool.count({ where }),
    ]);
    return { tools, total };
  }

  async getById(id: string): Promise<Tool | null> {
    return db.tool.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    provider: string;
    category: TaskCategory;
    capabilities: string[];
    supportedTasks: string[];
    approvalStatus: ApprovalStatus;
    dataHandling: string;
    docsUrl?: string | null;
    limitations?: string | null;
    recommendedUseCases: string[];
    lastReviewedAt?: Date | null;
  }): Promise<Tool> {
    return db.tool.create({
      data: {
        name: data.name,
        provider: data.provider,
        category: data.category,
        capabilities: data.capabilities,
        supportedTasks: data.supportedTasks,
        approvalStatus: data.approvalStatus,
        dataHandling: data.dataHandling,
        docsUrl: data.docsUrl ?? null,
        limitations: data.limitations ?? null,
        recommendedUseCases: data.recommendedUseCases,
        lastReviewedAt: data.lastReviewedAt ?? null,
      },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    provider: string;
    category: TaskCategory;
    capabilities: string[];
    supportedTasks: string[];
    approvalStatus: ApprovalStatus;
    dataHandling: string;
    docsUrl: string | null;
    limitations: string | null;
    recommendedUseCases: string[];
    lastReviewedAt: Date | null;
  }>): Promise<Tool> {
    return db.tool.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Tool> {
    return db.tool.delete({ where: { id } });
  }
}

export const toolsService = new ToolsService();
