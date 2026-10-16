import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { ChangeType, ChangeReviewStatus } from "@prisma/client";
import { db } from "@/server/db/client";

const schema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("20"),
  provider: z.string().optional(),
  changeType: z.nativeEnum(ChangeType).optional(),
  reviewStatus: z.nativeEnum(ChangeReviewStatus).optional().default(ChangeReviewStatus.PENDING),
  impact: z.string().optional(),
  search: z.string().optional(),
});

export const GET = withQueryValidation(schema, async (_req, validated) => {
  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);

  const where: any = {};
  if (validated.provider) where.source = { provider: { contains: validated.provider, mode: "insensitive" } };
  if (validated.changeType) where.changeType = validated.changeType;
  if (validated.reviewStatus) where.reviewStatus = validated.reviewStatus;
  if (validated.impact) where.impact = validated.impact;
  if (validated.search) {
    where.OR = [
      { entityType: { contains: validated.search, mode: "insensitive" } },
      { diff: { contains: validated.search, mode: "insensitive" } },
      { sourceEvidence: { contains: validated.search, mode: "insensitive" } },
    ];
  }

  const [changes, total] = await Promise.all([
    db.changeEvent.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { detectedAt: "desc" },
      include: {
        source: { select: { id: true, name: true, provider: true, reliability: true } },
        document: { select: { id: true, title: true, url: true, publishedAt: true } },
      },
    }),
    db.changeEvent.count({ where }),
  ]);

  return NextResponse.json({
    items: changes.map((c) => ({
      id: c.id,
      entityType: c.entityType,
      entityId: c.entityId,
      changeType: c.changeType,
      diff: c.diff,
      oldValue: c.oldValue,
      newValue: c.newValue,
      sourceEvidence: c.sourceEvidence,
      sourcePublicationDate: c.sourcePublicationDate,
      detectedAt: c.detectedAt,
      confidence: c.confidence,
      impact: c.impact,
      reviewStatus: c.reviewStatus,
      published: c.published,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      source: c.source,
      document: c.document,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});
