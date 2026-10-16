/* eslint-disable @typescript-eslint/no-explicit-any -- Dynamic recommendation scoring uses dynamic model data */
import { db } from "@/server/db/client";
import { ModelProfile, ModelPricing, Tool, ApprovalStatus, DataClassification, LifecycleStatus } from "@prisma/client";
import { pricingService } from "@/server/services/pricing.service";

export interface DynamicRecommendationRequest {
  taskCategory: string;
  dataClassification: DataClassification;
  budgetCeiling?: number; // max cost per 1M tokens
  maxLatencyMs?: number;
  preferredCapabilities?: string[];
  excludeDeprecated?: boolean;
  userId: string;
}

export interface ModelRecommendation {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  displayName: string;
  lifecycleStatus: string;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportsCaching: boolean;
  capabilities: string[];
  approvalStatus: string;
  verificationStatus: string;
  confidence: number;
  lastVerifiedAt: Date | null;
  pricing: {
    inputRatePerMillion: number;
    outputRatePerMillion: number;
    cachedInputRatePerMillion: number | null;
    currency: string;
    source: string;
    isIllustrative: boolean;
    isVerified: boolean;
    effectiveAt: Date;
  } | null;
  fitScore: number;
  fitReason: string;
  tradeOffs: string[];
  alternatives: string[];
  evidence: {
    sourceUrl: string | null;
    lastVerifiedAt: Date | null;
    freshness: string;
  };
}

export interface DynamicRecommendationResult {
  recommendedModel: ModelRecommendation | null;
  alternatives: ModelRecommendation[];
  warnings: string[];
  verificationChecklist: string[];
  appliedFilters: {
    dataClassification: string;
    budgetCeiling: number | null;
    excludedDeprecated: boolean;
  };
  generatedAt: Date;
}

const CLASSIFICATION_ALLOWED_LIFECYCLE: Record<DataClassification, LifecycleStatus[]> = {
  [DataClassification.PUBLIC]: [
    LifecycleStatus.GENERAL_AVAILABILITY,
    LifecycleStatus.PREVIEW,
    LifecycleStatus.ANNOUNCED,
  ],
  [DataClassification.INTERNAL]: [
    LifecycleStatus.GENERAL_AVAILABILITY,
    LifecycleStatus.PREVIEW,
  ],
  [DataClassification.CONFIDENTIAL]: [LifecycleStatus.GENERAL_AVAILABILITY],
  [DataClassification.RESTRICTED]: [LifecycleStatus.GENERAL_AVAILABILITY],
};

export class DynamicRecommendationService {
  async recommend(request: DynamicRecommendationRequest): Promise<DynamicRecommendationResult> {
    const { taskCategory, dataClassification, budgetCeiling, maxLatencyMs, preferredCapabilities, excludeDeprecated = true, userId } = request;

    const allowedLifecycle = CLASSIFICATION_ALLOWED_LIFECYCLE[dataClassification];

    // Fetch approved models with their current pricing
    const models = await db.modelProfile.findMany({
      where: {
        isApproved: true,
        lifecycleStatus: { in: allowedLifecycle },
        ...(excludeDeprecated ? { NOT: { lifecycleStatus: { in: [LifecycleStatus.DEPRECATED, LifecycleStatus.SHUTDOWN] } } } : {}),
      },
      include: {
        pricings: {
          where: { isCurrent: true },
          orderBy: { effectiveAt: "desc" },
          take: 1,
        },
        benchmarks: {
          orderBy: { date: "desc" },
          take: 3,
        },
        deprecations: {
          where: { isActive: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const warnings: string[] = [];

    if (dataClassification === DataClassification.RESTRICTED) {
      warnings.push("Restricted data: only use models explicitly approved for Restricted classification.");
    } else if (dataClassification === DataClassification.CONFIDENTIAL) {
      warnings.push("Confidential data: confirm the model's data handling guidance before sharing source code or customer data.");
    }

    // Apply budget filter
    let filtered = models;
    if (budgetCeiling !== undefined) {
      filtered = filtered.filter((m) => {
        const pricing = m.pricings[0];
        if (!pricing) return true; // No pricing = can't evaluate cost, keep it
        const maxRate = Math.max(pricing.inputRatePerMillion.toNumber(), pricing.outputRatePerMillion.toNumber());
        return maxRate <= budgetCeiling;
      });
      if (filtered.length === 0 && models.length > 0) {
        warnings.push("No models fit within the specified budget ceiling. Consider increasing the budget or adjusting requirements.");
      }
    }

    // Score and rank models
    const scored = filtered.map((m) => this.scoreModel(m, taskCategory, preferredCapabilities, dataClassification));

    // Sort by fit score descending
    scored.sort((a, b) => b.fitScore - a.fitScore);

    const recommended = scored[0];
    const alternatives = scored.slice(1, 5);

    const verificationChecklist = [
      "Confirm the model is approved for your data classification.",
      "Review the model's terms of service and data handling policy.",
      "Validate model outputs before using in production.",
      "Check the provider's current pricing and terms.",
    ];

    return {
      recommendedModel: recommended ? this.mapToRecommendation(recommended.model, recommended) : null,
      alternatives: alternatives.map((s) => this.mapToRecommendation(s.model, s)),
      warnings,
      verificationChecklist,
      appliedFilters: {
        dataClassification: dataClassification,
        budgetCeiling: budgetCeiling ?? null,
        excludedDeprecated: excludeDeprecated,
      },
      generatedAt: new Date(),
    };
  }

  private scoreModel(
    model: ModelProfile & { pricings: ModelPricing[]; benchmarks: any[]; deprecations: any[] },
    taskCategory: string,
    preferredCapabilities?: string[],
    dataClassification?: DataClassification
  ): { model: ModelProfile; fitScore: number; fitReason: string; tradeOffs: string[] } {
    let score = 50; // base score
    const tradeOffs: string[] = [];
    const reasonParts: string[] = [];

    // Lifecycle scoring
    if (model.lifecycleStatus === LifecycleStatus.GENERAL_AVAILABILITY) {
      score += 20;
      reasonParts.push("generally available");
    } else if (model.lifecycleStatus === LifecycleStatus.PREVIEW) {
      score += 10;
      tradeOffs.push("Preview release - may have breaking changes");
    } else if (model.lifecycleStatus === LifecycleStatus.ANNOUNCED) {
      score += 5;
      tradeOffs.push("Announced but not yet released");
    }

    // Pricing scoring (lower cost = higher score)
    const pricing = model.pricings[0];
    if (pricing) {
      const inputRate = pricing.inputRatePerMillion.toNumber();
      const outputRate = pricing.outputRatePerMillion.toNumber();
      const avgRate = (inputRate + outputRate) / 2;
      if (avgRate === 0) {
        score += 10;
        tradeOffs.push("Zero/illustrative pricing - verify with provider");
      } else if (avgRate < 5) {
        score += 10;
      } else if (avgRate < 15) {
        score += 5;
      } else if (avgRate > 30) {
        score -= 10;
        tradeOffs.push("Higher cost per 1M tokens");
      }
      if (!pricing.isVerified) {
        tradeOffs.push("Pricing not yet verified against authoritative source");
      }
    } else {
      score -= 10;
      tradeOffs.push("No current pricing configured");
    }

    // Capability matching
    if (preferredCapabilities && preferredCapabilities.length > 0) {
      const modelCaps = (model as any).capabilities || [];
      const matchingCaps = preferredCapabilities.filter((c) => modelCaps.includes(c));
      score += matchingCaps.length * 5;
      if (matchingCaps.length > 0) {
        reasonParts.push(`supports ${matchingCaps.join(", ")}`);
      }
    }

    // Context window scoring
    if (model.contextWindow) {
      if (model.contextWindow >= 100000) {
        score += 5;
      } else if (model.contextWindow < 8192) {
        score -= 5;
        tradeOffs.push("Small context window");
      }
    }

    // Verification status
    if (model.verificationStatus === "verified") {
      score += 10;
    } else if (model.verificationStatus === "conflicting") {
      score -= 10;
      tradeOffs.push("Conflicting information from sources");
    }

    // Deprecation warning
    if (model.deprecations.length > 0) {
      score -= 20;
      tradeOffs.push("Deprecation notice active");
    }

    const fitReason = reasonParts.length > 0
      ? `${model.displayName} (${model.provider}) - ${reasonParts.join(", ")}`
      : `${model.displayName} (${model.provider}) - suitable for ${taskCategory}`;

    return {
      model,
      fitScore: Math.max(0, Math.min(100, score)),
      fitReason,
      tradeOffs,
    };
  }

  private mapToRecommendation(
    model: ModelProfile,
    scored: { fitScore: number; fitReason: string; tradeOffs: string[] }
  ): ModelRecommendation {
    const pricing = (model as any).pricings?.[0];
    const benchmarks = (model as any).benchmarks || [];
    const deprecations = (model as any).deprecations || [];

    const pricingInfo = pricing
      ? {
          inputRatePerMillion: pricing.inputRatePerMillion.toNumber(),
          outputRatePerMillion: pricing.outputRatePerMillion.toNumber(),
          cachedInputRatePerMillion: pricing.cachedInputRatePerMillion?.toNumber() ?? null,
          currency: pricing.currency,
          source: pricing.source,
          isIllustrative: pricing.isIllustrative,
          isVerified: pricing.isVerified,
          effectiveAt: pricing.effectiveAt,
        }
      : null;

    const benchmarksSummary = benchmarks.map((b: any) => ({
      benchmark: b.benchmarkName,
      score: b.score,
      category: b.category,
      date: b.date,
    }));

    const deprecationNotice = deprecations.length > 0
      ? `Deprecated${deprecations[0].deprecationDate ? ` since ${deprecations[0].deprecationDate.toISOString()}` : ""}. ${deprecations[0].reason ?? ""}`
      : null;

    const alternatives = deprecationNotice ? [deprecationNotice] : [];
    if (benchmarksSummary.length > 0) {
      alternatives.push(`Benchmarks: ${benchmarksSummary.map((b: any) => `${b.benchmark}=${b.score}`).join(", ")}`);
    }

    const freshness = model.lastVerifiedAt
      ? `Last verified ${this.formatRelativeDate(model.lastVerifiedAt)}`
      : "Not yet verified";

    return {
      id: model.id,
      modelId: model.name,
      name: model.name,
      provider: model.provider,
      displayName: model.displayName,
      lifecycleStatus: model.lifecycleStatus,
      contextWindow: model.contextWindow ?? null,
      maxOutputTokens: model.maxOutputTokens ?? null,
      supportsCaching: model.supportsCaching,
      capabilities: [],
      approvalStatus: model.isApproved ? "approved" : "pending",
      verificationStatus: model.verificationStatus,
      confidence: model.confidence,
      lastVerifiedAt: model.lastVerifiedAt,
      pricing: pricingInfo,
      fitScore: scored.fitScore,
      fitReason: scored.fitReason,
      tradeOffs: scored.tradeOffs,
      alternatives,
      evidence: {
        sourceUrl: model.sourceUrl,
        lastVerifiedAt: model.lastVerifiedAt,
        freshness,
      },
    };
  }

  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
}

export const dynamicRecommendationService = new DynamicRecommendationService();
