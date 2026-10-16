import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const schema = z.object({
  force: z.string().optional().default("false"),
});

export const POST = withValidation(schema, async (_req, validated, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  try {
    const result = await ingestionService.syncSource(id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
