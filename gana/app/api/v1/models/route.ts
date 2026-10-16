import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { LifecycleStatus } from "@prisma/client";
import { db } from "@/server/db/client";

const schema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
  provider: z.string().optional(),
  lifecycleStatus: z.nativeEnum(LifecycleStatus).optional(),
  isApproved: z.string().optional().default("true"),
  search: z.string().optional(),
});

export const GET = withQueryValidation(schema, async (_req, validated) => {
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);

  const where: any = {};
  if (validated.provider) where.provider = { contains: validated.provider, mode: "insensitive" };
  if (validated.lifecycleStatus) where.lifecycleStatus = validated.lifecycleStatus;
  if (validated.isApproved !== undefined) where.isApproved = validated.isApproved === "true";
  if (validated.search) {
    where.OR = [
      { name: { contains: validated.search, mode: "insensitive" } },
      { displayName: { contains: validated.search, mode: "insensitive" } },
      { provider: { contains: validated.search, mode: "insensitive" } },
    ];
  }

  const [models, total] = await Promise.all([
    db.modelProfile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        pricings: {
          where: { isCurrent: true },
          take: 1,
        },
        deprecations: {
          where: { isActive: true },
          take: 1,
        },
      },
    }),
    db.modelProfile.count({ where }),
  ]);

  return NextResponse.json({
    items: models.map((m) => ({
      id: m.id,
      modelId: m.name,
      name: m.name,
      displayName: m.displayName,
      provider: m.provider,
      lifecycleStatus: m.lifecycleStatus,
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      supportsCaching: m.supportsCaching,
      isApproved: m.isApproved,
      verificationStatus: m.verificationStatus,
      confidence: m.confidence,
      lastVerifiedAt: m.lastVerifiedAt,
      sourceUrl: m.sourceUrl,
      releaseDate: m.releaseDate,
      deprecationNotice: m.deprecations[0]?.reason ?? null,
      currentPricing: m.pricings[0] ? {
        inputRatePerMillion: m.pricings[0].inputRatePerMillion.toNumber(),
        outputRatePerMillion: m.pricings[0].outputRatePerMillion.toNumber(),
        currency: m.pricings[0].currency,
        isIllustrative: m.pricings[0].isIllustrative,
        isVerified: m.pricings[0].isVerified,
      } : null,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});
