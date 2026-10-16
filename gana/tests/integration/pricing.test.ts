import { describe, it, expect } from "vitest";
import { pricingService } from "@/server/services/pricing.service";

describe("pricing calculation", () => {
  it("calculates cost for the mock model (zero illustrative pricing)", async () => {
    const breakdown = await pricingService.calculateCost({
      modelId: "mock-model",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(breakdown.totalCost).toBe(0);
    expect(breakdown.inputCost).toBe(0);
    expect(breakdown.outputCost).toBe(0);
    expect(breakdown.isEstimate).toBe(true);
    expect(breakdown.isIllustrative).toBe(true);
  });

  it("calculates cost using the formula inputRate/1M + outputRate/1M", async () => {
    const breakdown = await pricingService.calculateCost({
      modelId: "claude-3-5-sonnet",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    // inputRate 3.0 per 1M, outputRate 15.0 per 1M
    expect(breakdown.inputCost).toBeCloseTo(3.0, 4);
    expect(breakdown.outputCost).toBeCloseTo(15.0, 4);
    expect(breakdown.totalCost).toBeCloseTo(18.0, 4);
  });

  it("accounts for cached tokens when supported", async () => {
    const breakdown = await pricingService.calculateCost({
      modelId: "claude-3-5-sonnet",
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 500_000,
    });
    expect(breakdown.cachedTokens).toBe(500_000);
    expect(breakdown.cachedCost).toBeGreaterThan(0);
    expect(breakdown.totalCost).toBe(
      breakdown.inputCost + breakdown.outputCost + breakdown.cachedCost
    );
  });

  it("handles zero usage", async () => {
    const breakdown = await pricingService.calculateCost({
      modelId: "mock-model",
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(breakdown.totalCost).toBe(0);
  });

  it("returns estimate flag when no pricing exists", async () => {
    const breakdown = await pricingService.calculateCost({
      modelId: "nonexistent-model",
      inputTokens: 100,
      outputTokens: 100,
    });
    expect(breakdown.totalCost).toBe(0);
    expect(breakdown.isEstimate).toBe(true);
  });

  it("validates non-negative token counts", async () => {
    await expect(
      pricingService.calculateCost({ modelId: "mock-model", inputTokens: -1, outputTokens: 0 })
    ).rejects.toThrow();
  });
});
