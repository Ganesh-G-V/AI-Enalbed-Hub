import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { knowledgeService } from "@/server/services/knowledge.service";
import { adminService } from "@/server/services/admin.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().optional(),
  sourceUrl: z.string().url().optional().nullable(),
  version: z.string().min(1),
  reviewedAt: z.string().datetime().optional().nullable(),
  nextReviewAt: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().default(false),
  isSample: z.boolean().default(true),
  roleAccess: z.array(z.string()).default(["member"]),
  tags: z.array(z.string()).default([]),
});

export const POST = withValidation(schema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const doc = await knowledgeService.create({
    title: validated.title,
    category: validated.category,
    content: validated.content,
    summary: validated.summary ?? null,
    sourceUrl: validated.sourceUrl ?? undefined,
    version: validated.version,
    reviewedAt: validated.reviewedAt ? new Date(validated.reviewedAt) : undefined,
    nextReviewAt: validated.nextReviewAt ? new Date(validated.nextReviewAt) : undefined,
    isPublished: validated.isPublished,
    isSample: validated.isSample,
    roleAccess: validated.roleAccess,
    tags: validated.tags,
  });
  await adminService.logAudit({
    actorId: auth.userId,
    action: "admin.knowledge.create",
    targetType: "knowledge_document",
    targetId: doc.id,
    metadata: { title: validated.title, category: validated.category },
  });
  return NextResponse.json(doc, { status: 201 });
});
