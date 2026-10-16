import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation, withValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";
import { SourceType, SourceReliability } from "@prisma/client";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const listSchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
});

export const GET = withQueryValidation(listSchema, async (_req, validated) => {
  const sources = await ingestionService.listSources();
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const total = sources.length;
  return NextResponse.json({
    items: sources.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(200),
  type: z.nativeEnum(SourceType),
  url: z.string().url(),
  pollIntervalMs: z.string().optional().default("3600000"),
  reliability: z.nativeEnum(SourceReliability).optional().default(SourceReliability.UNVERIFIED),
  extractionMethod: z.string().optional().default("api"),
});

export const POST = withValidation(createSchema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const source = await ingestionService.registerSource({
    name: validated.name,
    provider: validated.provider,
    type: validated.type,
    url: validated.url,
    pollIntervalMs: parseInt(validated.pollIntervalMs, 10),
    reliability: validated.reliability,
    extractionMethod: validated.extractionMethod,
  });
  return NextResponse.json(source, { status: 201 });
});
