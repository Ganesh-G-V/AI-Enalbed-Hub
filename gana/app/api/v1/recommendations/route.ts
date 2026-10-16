import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { recommendationService } from "@/server/services/recommendation.service";
import { TaskCategory, DataClassification } from "@prisma/client";

const bodySchema = z.object({
  taskCategory: z.nativeEnum(TaskCategory),
  role: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  dataClassification: z.nativeEnum(DataClassification),
  preference: z.enum(["lowest_cost", "balanced", "highest_capability", "lowest_latency"]),
});

export const POST = withValidation(bodySchema, async (_req, validated) => {
  const result = await recommendationService.recommend(validated);
  return NextResponse.json(result);
});
