import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const model = await db.modelProfile.findUnique({
    where: { id },
    include: {
      pricings: {
        orderBy: { effectiveAt: "desc" },
        take: 5,
      },
      deprecations: {
        where: { isActive: true },
      },
      benchmarks: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });

  if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 });

  return NextResponse.json({
    id: model.id,
    modelId: model.name,
    name: model.name,
    displayName: model.displayName,
    provider: model.provider,
    lifecycleStatus: model.lifecycleStatus,
    contextWindow: model.contextWindow,
    maxOutputTokens: model.maxOutputTokens,
    supportsCaching: model.supportsCaching,
    isApproved: model.isApproved,
    verificationStatus: model.verificationStatus,
    confidence: model.confidence,
    lastVerifiedAt: model.lastVerifiedAt,
    sourceUrl: model.sourceUrl,
    releaseDate: model.releaseDate,
    deprecationDate: model.deprecationDate,
    shutdownDate: model.shutdownDate,
    pricings: model.pricings.map((p) => ({
      id: p.id,
      version: p.version,
      effectiveAt: p.effectiveAt,
      inputRatePerMillion: p.inputRatePerMillion.toNumber(),
      outputRatePerMillion: p.outputRatePerMillion.toNumber(),
      cachedInputRatePerMillion: p.cachedInputRatePerMillion?.toNumber() ?? null,
      currency: p.currency,
      source: p.source,
      assumptions: p.assumptions,
      isIllustrative: p.isIllustrative,
      isCurrent: p.isCurrent,
      isVerified: p.isVerified,
    })),
    deprecations: model.deprecations.map((d) => ({
      id: d.id,
      announcedAt: d.announcedAt,
      deprecationDate: d.deprecationDate,
      shutdownDate: d.shutdownDate,
      reason: d.reason,
      migrationGuide: d.migrationGuide,
      replacementModel: d.replacementModel,
      sourceUrl: d.sourceUrl,
    })),
    benchmarks: model.benchmarks.map((b) => ({
      id: b.id,
      benchmarkName: b.benchmarkName,
      benchmarkVersion: b.benchmarkVersion,
      score: b.score,
      category: b.category,
      conditions: b.conditions,
      date: b.date,
      sourceUrl: b.sourceUrl,
      isOfficial: b.isOfficial,
    })),
  });
}
