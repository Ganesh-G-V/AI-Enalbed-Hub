import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { evaluationsService } from "@/server/services/evaluations.service";
import { resolveAuth } from "@/lib/auth";

const schema = z.object({
  scenarioId: z.string().min(1),
  userId: z.string().min(1),
  modelId: z.string().min(1),
  promptId: z.string().optional(),
});

export const POST = withValidation(schema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const run = await evaluationsService.createRun({
    scenarioId: validated.scenarioId,
    userId: validated.userId || auth.userId,
    modelId: validated.modelId,
    promptId: validated.promptId,
  });
  return NextResponse.json(run, { status: 201 });
});
