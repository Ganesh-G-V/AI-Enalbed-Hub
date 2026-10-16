import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const schema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
});

export const GET = withQueryValidation(schema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const { items: changes, total } = await ingestionService.getPendingChanges({ page, pageSize });
  return NextResponse.json({
    items: changes,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export const POST = async (_req: Request) => {
  // Admin review endpoint is handled at /api/v1/changes/[id]/review
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
