import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { usageService } from "@/server/services/usage.service";

const querySchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const GET = withQueryValidation(querySchema, async (_req, validated) => {
  const summary = await usageService.summary({
    userId: validated.userId,
    startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    endDate: validated.endDate ? new Date(validated.endDate) : undefined,
  });
  return NextResponse.json(summary);
});
