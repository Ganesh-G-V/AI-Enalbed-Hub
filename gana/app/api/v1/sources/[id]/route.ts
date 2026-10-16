import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";
import { SourceReliability } from "@prisma/client";
import { resolveAuth, requireAdmin } from "@/lib/auth";
import { db } from "@/server/db/client";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  enabled: z.boolean().optional(),
  pollIntervalMs: z.string().optional(),
  reliability: z.nativeEnum(SourceReliability).optional(),
});

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const sources = await ingestionService.listSources();
  const source = sources.find((s) => (s as { id: string }).id === id);
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  return NextResponse.json(source);
};

export const PATCH = withValidation(updateSchema, async (_req, validated, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const source = await ingestionService.updateSource(id, {
    name: validated.name,
    enabled: validated.enabled,
    pollIntervalMs: validated.pollIntervalMs ? parseInt(validated.pollIntervalMs, 10) : undefined,
    reliability: validated.reliability,
  });
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  return NextResponse.json(source);
});

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  await db.sourceRegistry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
};
