import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { pricingService } from "@/server/services/pricing.service";

const estimateSchema = z.object({
  modelId: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative().optional().default(0),
});

export const POST = withValidation(estimateSchema, async (_req, validated) => {
  const breakdown = await pricingService.calculateCost({
    modelId: validated.modelId,
    inputTokens: validated.inputTokens,
    outputTokens: validated.outputTokens,
    cachedTokens: validated.cachedTokens,
  });
  return NextResponse.json(breakdown);
});
