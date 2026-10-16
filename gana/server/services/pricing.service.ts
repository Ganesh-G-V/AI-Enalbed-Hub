import { db } from "@/server/db/client";
import { ModelPricing, ModelProfile, Prisma } from "@prisma/client";

export interface PriceBreakdown {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  inputRate: number;
  outputRate: number;
  cachedRate: number | null;
  inputCost: number;
  outputCost: number;
  cachedCost: number;
  totalCost: number;
  currency: string;
  model: string;
  provider: string;
  version: number;
  effectiveAt: Date;
  source: string;
  assumptions: string;
  isIllustrative: boolean;
  isEstimate: boolean;
}

export interface PricingProfile {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  version: number;
  effectiveAt: Date;
  inputRatePerMillion: number;
  outputRatePerMillion: number;
  cachedInputRatePerMillion: number | null;
  currency: string;
  source: string;
  assumptions: string;
  isIllustrative: boolean;
  isCurrent: boolean;
}

/**
 * PricingService: versioned, DB-backed pricing independent of the frontend.
 * Reads approved, versioned pricing records and returns a full calculation
 * breakdown with assumptions.
 */
export class PricingService {
  async getCurrentPricing(modelId: string): Promise<PricingProfile | null> {
    // Resolve a model by name if a direct pricing.modelId (cuid) match fails.
    const resolvedModelId = modelId;
    const direct = await db.modelPricing.findFirst({
      where: { modelId: resolvedModelId, isCurrent: true },
      include: { model: true },
      orderBy: { effectiveAt: "desc" },
    });
    if (direct) return this.mapProfile(direct);
    const model = await db.modelProfile.findFirst({ where: { name: modelId } });
    if (model) {
      const byModel = await db.modelPricing.findFirst({
        where: { modelId: model.id, isCurrent: true },
        include: { model: true },
        orderBy: { effectiveAt: "desc" },
      });
      if (byModel) return this.mapProfile(byModel);
    }
    return null;
  }

  async getPricingById(id: string): Promise<PricingProfile | null> {
    const pricing = await db.modelPricing.findUnique({
      where: { id },
      include: { model: true },
    });
    if (!pricing) return null;
    return this.mapProfile(pricing);
  }

  async listPricing(modelId?: string): Promise<PricingProfile[]> {
    const pricing = await db.modelPricing.findMany({
      where: modelId ? { modelId } : {},
      include: { model: true },
      orderBy: [{ modelId: "asc" }, { version: "desc" }],
    });
    return pricing.map((p) => this.mapProfile(p));
  }

  async createPricing(data: {
    modelId: string;
    version: number;
    effectiveAt: Date;
    inputRatePerMillion: number;
    outputRatePerMillion: number;
    cachedInputRatePerMillion?: number | null;
    currency: string;
    source: string;
    assumptions: string;
    isIllustrative: boolean;
    isCurrent?: boolean;
  }): Promise<PricingProfile> {
    // Validate token rates are non-negative.
    if (data.inputRatePerMillion < 0 || data.outputRatePerMillion < 0) {
      throw new Error("Pricing rates must be non-negative.");
    }
    if (data.cachedInputRatePerMillion !== null && data.cachedInputRatePerMillion !== undefined && data.cachedInputRatePerMillion < 0) {
      throw new Error("Cached input rate must be non-negative.");
    }

    const pricing = await db.modelPricing.create({
      data: {
        model: { connect: { id: data.modelId } },
        version: data.version,
        effectiveAt: data.effectiveAt,
        inputRatePerMillion: new Prisma.Decimal(data.inputRatePerMillion),
        outputRatePerMillion: new Prisma.Decimal(data.outputRatePerMillion),
        cachedInputRatePerMillion: data.cachedInputRatePerMillion != null
          ? new Prisma.Decimal(data.cachedInputRatePerMillion)
          : null,
        currency: data.currency,
        source: data.source,
        assumptions: data.assumptions,
        isIllustrative: data.isIllustrative,
        isCurrent: data.isCurrent ?? false,
      },
      include: { model: true },
    });
    return this.mapProfile(pricing);
  }

  /**
   * Calculate cost for a given token breakdown using the current pricing for a model.
   * Returns a detailed breakdown and assumptions. Never throws for zero usage;
   * returns a zero-cost breakdown if pricing is missing (isEstimate = true).
   */
  async calculateCost(params: {
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  }): Promise<PriceBreakdown> {
    const { modelId, inputTokens, outputTokens, cachedTokens = 0 } = params;

    if (inputTokens < 0 || outputTokens < 0 || cachedTokens < 0) {
      throw new Error("Token counts must be non-negative.");
    }

    const pricing = await this.getCurrentPricing(modelId);
    const isEstimate = !pricing || pricing.isIllustrative;

    const inputRate = pricing?.inputRatePerMillion ?? 0;
    const outputRate = pricing?.outputRatePerMillion ?? 0;
    const cachedRate = pricing?.cachedInputRatePerMillion ?? inputRate * 0.5;

    const inputCost = (inputTokens / 1_000_000) * inputRate;
    const outputCost = (outputTokens / 1_000_000) * outputRate;
    const cachedCost = (cachedTokens / 1_000_000) * cachedRate;
    const totalCost = inputCost + outputCost + cachedCost;

    return {
      inputTokens,
      outputTokens,
      cachedTokens,
      inputRate,
      outputRate,
      cachedRate: pricing?.cachedInputRatePerMillion ?? null,
      inputCost: Number(inputCost.toFixed(6)),
      outputCost: Number(outputCost.toFixed(6)),
      cachedCost: Number(cachedCost.toFixed(6)),
      totalCost: Number(totalCost.toFixed(6)),
      currency: pricing?.currency ?? "USD",
      model: pricing?.modelName ?? modelId,
      provider: pricing?.provider ?? "unknown",
      version: pricing?.version ?? 0,
      effectiveAt: pricing?.effectiveAt ?? new Date(),
      source: pricing?.source ?? "no pricing configured",
      assumptions: pricing?.assumptions ?? "No pricing profile found; costs are illustrative estimates.",
      isIllustrative: pricing?.isIllustrative ?? true,
      isEstimate,
    };
  }

  async compareCost(params: {
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  }): Promise<PriceBreakdown> {
    // Compare is the same calculation but labeled as a comparison scenario.
    return this.calculateCost(params);
  }

  private mapProfile(p: ModelPricing & { model: ModelProfile }): PricingProfile {
    return {
      id: p.id,
      modelId: p.modelId,
      modelName: p.model.name,
      provider: p.model.provider,
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
    };
  }
}

export const pricingService = new PricingService();
