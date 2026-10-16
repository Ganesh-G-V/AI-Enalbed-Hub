import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { feedbackService } from "@/server/services/feedback.service";

const schema = z.object({
  userId: z.string().min(1),
  targetType: z.enum(["prompt", "knowledge", "assistant", "evaluation"]),
  targetId: z.string().min(1),
  rating: z.enum(["helpful", "not_helpful"]).transform((v) => (v === "helpful" ? "HELPFUL" : "NOT_HELPFUL")),
  comment: z.string().optional(),
});

export const POST = withValidation(schema, async (_req, validated) => {
  const fb = await feedbackService.submit({
    userId: validated.userId,
    targetType: validated.targetType,
    targetId: validated.targetId,
    rating: validated.rating,
    comment: validated.comment,
  });
  return NextResponse.json(fb, { status: 201 });
});
