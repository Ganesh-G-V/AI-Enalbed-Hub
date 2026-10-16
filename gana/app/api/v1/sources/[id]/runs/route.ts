import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";

const schema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
});

export const GET = withQueryValidation(schema, async (_req, validated, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // Find the job for this source
  const sources = await ingestionService.listSources();
  const source = sources.find((s) => (s as { id: string }).id === id);
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const job = source.jobs?.[0];
  if (!job) return NextResponse.json({ items: [], total: 0, page: 1, pageSize: 1, pageCount: 1 });

  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const runs = await ingestionService.getRunHistory(job.id, { page, pageSize });
  return NextResponse.json({
    items: runs,
    total: runs.length,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(runs.length / pageSize)),
  });
});
