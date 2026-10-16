import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation, withValidation } from "@/lib/api";
import { toolsService } from "@/server/services/tools.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";
import { TaskCategory, ApprovalStatus, DataClassification } from "@prisma/client";

const listQuerySchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
  category: z.nativeEnum(TaskCategory).optional(),
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
  dataClassification: z.nativeEnum(DataClassification).optional(),
  capability: z.string().optional(),
  search: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(200),
  category: z.nativeEnum(TaskCategory),
  capabilities: z.array(z.string()).default([]),
  supportedTasks: z.array(z.string()).default([]),
  approvalStatus: z.nativeEnum(ApprovalStatus).default(ApprovalStatus.PENDING),
  dataHandling: z.string().min(1),
  docsUrl: z.string().url().optional().nullable(),
  limitations: z.string().optional().nullable(),
  recommendedUseCases: z.array(z.string()).default([]),
  lastReviewedAt: z.string().datetime().optional().nullable(),
});

export const GET = withQueryValidation(listQuerySchema, async (_req, validated) => {
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const { tools, total } = await toolsService.list(
    {
      category: validated.category,
      approvalStatus: validated.approvalStatus,
      dataClassification: validated.dataClassification,
      capability: validated.capability,
      search: validated.search,
    },
    { page, pageSize }
  );
  return NextResponse.json({
    items: tools,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export const POST = withValidation(createSchema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const tool = await toolsService.create({
    name: validated.name,
    provider: validated.provider,
    category: validated.category,
    capabilities: validated.capabilities,
    supportedTasks: validated.supportedTasks,
    approvalStatus: validated.approvalStatus,
    dataHandling: validated.dataHandling,
    docsUrl: validated.docsUrl ?? undefined,
    limitations: validated.limitations ?? undefined,
    recommendedUseCases: validated.recommendedUseCases,
    lastReviewedAt: validated.lastReviewedAt ? new Date(validated.lastReviewedAt) : undefined,
  });
  return NextResponse.json(tool, { status: 201 });
});
