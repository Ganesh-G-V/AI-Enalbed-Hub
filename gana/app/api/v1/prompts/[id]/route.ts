import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { promptsService } from "@/server/services/prompts.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).optional(),
  description: z.string().max(1000).optional(),
  template: z.string().min(1).optional(),
  inputPlaceholders: z.array(z.string()).optional(),
  exampleInput: z.string().optional().nullable(),
  exampleOutput: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  expectedOutputFormat: z.string().optional().nullable(),
  commonFailureModes: z.string().optional().nullable(),
  qualityChecklist: z.string().optional().nullable(),
  applicableRole: z.string().min(1).optional(),
  difficulty: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prompt = await promptsService.getById(id);
  if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  return NextResponse.json(prompt);
}

export const PATCH = withValidation(updateSchema, async (_req, validated, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const prompt = await promptsService.update(id, validated);
  return NextResponse.json(prompt);
});

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  await promptsService.delete(id);
  return NextResponse.json({ ok: true });
}
