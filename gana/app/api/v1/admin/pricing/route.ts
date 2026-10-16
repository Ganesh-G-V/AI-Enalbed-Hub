import { NextResponse } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { pricingService } from "@/server/services/pricing.service";
import { adminService } from "@/server/services/admin.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const schema = z.object({
  modelId: z.string().min(1),
  version: z.number().int().positive().default(1),
  effectiveAt: z.string().datetime(),
  inputRatePerMillion: z.number().nonnegative(),
  outputRatePerMillion: z.number().nonnegative(),
  cachedInputRatePerMillion: z.number().nonnegative().optional().nullable(),
  currency: z.string().default("USD"),
  source: z.string().min(1),
  assumptions: z.string().min(1),
  isIllustrative: z.boolean().default(true),
  isCurrent: z.boolean().default(false),
});

export const POST = withValidation(schema, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const pricing = await pricingService.createPricing({
    modelId: validated.modelId,
    version: validated.version,
    effectiveAt: new Date(validated.effectiveAt),
    inputRatePerMillion: validated.inputRatePerMillion,
    outputRatePerMillion: validated.outputRatePerMillion,
    cachedInputRatePerMillion: validated.cachedInputRatePerMillion ?? null,
    currency: validated.currency,
    source: validated.source,
    assumptions: validated.assumptions,
    isIllustrative: validated.isIllustrative,
    isCurrent: validated.isCurrent,
  });
  await adminService.logAudit({
    actorId: auth.userId,
    action: "admin.pricing.create",
    targetType: "model_pricing",
    targetId: validated.modelId,
    metadata: { version: validated.version, isCurrent: validated.isCurrent },
  });
  return NextResponse.json(pricing, { status: 201 });
});
