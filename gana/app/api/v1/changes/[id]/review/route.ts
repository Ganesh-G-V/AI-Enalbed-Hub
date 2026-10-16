import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { ingestionService } from "@/server/ingestion/service";
import { ChangeReviewStatus } from "@prisma/client";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const reviewSchema = z.object({
  status: z.nativeEnum(ChangeReviewStatus),
  notes: z.string().optional().nullable(),
  correctedValue: z.string().optional(), // JSON string of corrected value
});

export const POST = withValidation(reviewSchema, async (_req, validated, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const correctedValue = validated.correctedValue ? JSON.parse(validated.correctedValue) : undefined;

  const change = await ingestionService.reviewChange({
    changeId: id,
    reviewerId: auth.userId,
    status: validated.status,
    notes: validated.notes ?? null,
    correctedValue,
  });

  if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });
  return NextResponse.json(change);
});
