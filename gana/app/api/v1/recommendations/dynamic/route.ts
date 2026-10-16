import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { dynamicRecommendationService } from "@/server/services/dynamic-recommendation.service";
import { DataClassification } from "@prisma/client";
import { resolveAuth } from "@/lib/auth";

const schema = z.object({
  taskCategory: z.string().min(1),
  dataClassification: z.nativeEnum(DataClassification),
  budgetCeiling: z.number().nonnegative().optional(),
  maxLatencyMs: z.number().nonnegative().optional(),
  preferredCapabilities: z.array(z.string()).optional().default([]),
  excludeDeprecated: z.boolean().default(true),
});

export const POST = withValidation(schema, async (_req, validated) => {
  const auth = resolveAuth(_req);

  const result = await dynamicRecommendationService.recommend({
    taskCategory: validated.taskCategory,
    dataClassification: validated.dataClassification,
    budgetCeiling: validated.budgetCeiling,
    maxLatencyMs: validated.maxLatencyMs,
    preferredCapabilities: validated.preferredCapabilities,
    excludeDeprecated: validated.excludeDeprecated,
    userId: auth.userId,
  });

  return NextResponse.json(result);
});
