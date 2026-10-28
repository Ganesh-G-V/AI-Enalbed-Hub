import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const recordSchema = z.object({
  modelId: z.string().min(1),
  inputRatePerMillion: z.number().nonnegative(),
  outputRatePerMillion: z.number().nonnegative(),
  cachedInputRatePerMillion: z.number().nonnegative().optional(),
  currency: z.string().default("USD"),
  effectiveAt: z.string().datetime().optional(),
  source: z.string().url(),
});

const bodySchema = z.object({
  records: z.array(recordSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const auth = resolveAuth(req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results = { created: 0, updated: 0, skipped: 0, rejected: 0, errors: [] as string[] };

  try {
    await db.$transaction(async (tx) => {
      for (const r of parsed.data.records) {
        const model = await tx.modelProfile.findUnique({ where: { id: r.modelId } });
        if (!model) {
          results.rejected++;
          results.errors.push(`Unknown modelId: ${r.modelId}`);
          continue;
        }

        const last = await tx.modelPricing.findFirst({
          where: { modelId: r.modelId },
          orderBy: { version: "desc" },
        });

        const same = last &&
          Number(last.inputRatePerMillion) === r.inputRatePerMillion &&
          Number(last.outputRatePerMillion) === r.outputRatePerMillion &&
          (last.cachedInputRatePerMillion == null ? r.cachedInputRatePerMillion == null : Number(last.cachedInputRatePerMillion) === r.cachedInputRatePerMillion);

        if (same) {
          results.skipped++;
          continue;
        }

        const nextVersion = last ? last.version + 1 : 1;

        if (last) {
          await tx.modelPricing.update({ where: { id: last.id }, data: { isCurrent: false } });
        }

        await tx.modelPricing.create({
          data: {
            modelId: r.modelId,
            version: nextVersion,
            effectiveAt: r.effectiveAt ? new Date(r.effectiveAt) : new Date(),
            inputRatePerMillion: r.inputRatePerMillion,
            outputRatePerMillion: r.outputRatePerMillion,
            cachedInputRatePerMillion: r.cachedInputRatePerMillion ?? null,
            currency: r.currency,
            source: r.source,
            assumptions: "Admin JSON import",
            isIllustrative: false,
            isCurrent: true,
            isVerified: false,
            verificationSource: "admin_import",
            confidence: 0.5,
          },
        });

        if (last) results.updated++;
        else results.created++;
      }
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json(results);
}
