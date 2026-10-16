import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { toolsService } from "@/server/services/tools.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";
import { adminService } from "@/server/services/admin.service";
import { ApprovalStatus, TaskCategory } from "@prisma/client";

const schema = z.object({
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

export const POST = withValidation(schema, async (_req, validated) => {
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
  await adminService.logAudit({
    actorId: auth.userId,
    action: "admin.tool.create",
    targetType: "tool",
    targetId: tool.id,
    metadata: { name: validated.name, provider: validated.provider },
  });
  return NextResponse.json(tool, { status: 201 });
});
