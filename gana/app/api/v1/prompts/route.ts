import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation, withValidation } from "@/lib/api";
import { promptsService } from "@/server/services/prompts.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const listQuerySchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
  category: z.string().optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  description: z.string().max(1000),
  template: z.string().min(1),
  inputPlaceholders: z.array(z.string()).default([]),
  exampleInput: z.string().optional(),
  exampleOutput: z.string().optional(),
  instructions: z.string().optional(),
  expectedOutputFormat: z.string().optional(),
  commonFailureModes: z.string().optional(),
  qualityChecklist: z.string().optional(),
  applicableRole: z.string().min(1),
  difficulty: z.string().min(1),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

export const GET = withQueryValidation(listQuerySchema, async (_req, validated) => {
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const { prompts, total } = await promptsService.list(
    { category: validated.category, search: validated.search, tag: validated.tag },
    { page, pageSize }
  );
  return NextResponse.json({ items: prompts, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
});

export const POST = withValidation(createSchema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const prompt = await promptsService.create(validated);
  return NextResponse.json(prompt, { status: 201 });
});
