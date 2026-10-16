import { db } from "@/server/db/client";
import { Prisma, TaskCategory } from "@prisma/client";
import { z } from "zod";

// Safe prompt variable substitution: only replaces {{variable}} placeholders
// with escaped string values. Never executes arbitrary template code.
const VARIABLE_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function substituteVariables(template: string, values: Record<string, string>): string {
  return template.replace(VARIABLE_RE, (match, name) => {
    if (name in values) {
      return escapeHtml(values[name]);
    }
    return match; // leave unknown placeholders intact
  });
}

export function extractVariables(template: string): string[] {
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_RE.exec(template)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

export function validateVariables(template: string, provided: Record<string, string>): { valid: boolean; missing: string[] } {
  const required = extractVariables(template);
  const missing = required.filter((v) => !(v in provided));
  return { valid: missing.length === 0, missing };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PromptCreateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string(),
  description: z.string().max(1000),
  template: z.string().min(1),
  inputPlaceholders: z.array(z.string()).default([]),
  exampleInput: z.string().optional(),
  exampleOutput: z.string().optional(),
  instructions: z.string().optional(),
  expectedOutputFormat: z.string().optional(),
  commonFailureModes: z.string().optional(),
  qualityChecklist: z.string().optional(),
  applicableRole: z.string(),
  difficulty: z.string(),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

export interface PromptFilters {
  category?: string;
  search?: string;
  tag?: string;
}

export class PromptsService {
  async list(filters: PromptFilters, { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) {
    const where: Record<string, unknown> = { isPublished: true };
    if (filters.category) where.category = filters.category as TaskCategory;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { tags: { has: filters.search } },
      ];
    }
    if (filters.tag) where.tags = { has: filters.tag };

    const [prompts, total] = await Promise.all([
      db.promptTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, title: true, category: true, description: true,
          applicableRole: true, difficulty: true, tags: true,
          exampleInput: true, exampleOutput: true, isPublished: true,
          updatedAt: true, _count: { select: { favorites: true } },
        },
      }),
      db.promptTemplate.count({ where }),
    ]);
    return { prompts, total };
  }

  async getById(id: string) {
    return db.promptTemplate.findUnique({ where: { id } });
  }

  async create(data: z.infer<typeof PromptCreateSchema>) {
    const parsed = PromptCreateSchema.parse(data);
    return db.promptTemplate.create({
      data: {
        title: parsed.title,
        category: parsed.category as TaskCategory,
        description: parsed.description,
        template: parsed.template,
        inputPlaceholders: parsed.inputPlaceholders,
        exampleInput: parsed.exampleInput ?? null,
        exampleOutput: parsed.exampleOutput ?? null,
        instructions: parsed.instructions ?? null,
        expectedOutputFormat: parsed.expectedOutputFormat ?? null,
        commonFailureModes: parsed.commonFailureModes ?? null,
        qualityChecklist: parsed.qualityChecklist ?? null,
        applicableRole: parsed.applicableRole,
        difficulty: parsed.difficulty,
        tags: parsed.tags,
        isPublished: parsed.isPublished,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return db.promptTemplate.update({ where: { id }, data: data as Prisma.PromptTemplateUpdateInput });
  }

  async delete(id: string) {
    return db.promptTemplate.delete({ where: { id } });
  }

  async toggleFavorite(userId: string, promptId: string) {
    const existing = await db.promptFavorite.findUnique({
      where: { userId_promptId: { userId, promptId } },
    });
    if (existing) {
      await db.promptFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await db.promptFavorite.create({ data: { userId, promptId } });
    return { favorited: true };
  }
}

export const promptsService = new PromptsService();
