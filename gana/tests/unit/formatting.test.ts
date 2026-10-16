import { describe, it, expect } from "vitest";
import {
  formatCurrencyValue,
  formatCompactNumber,
  formatTokenCount,
  formatPercent,
  formatRelativeDate,
  formatLatency,
  round2,
} from "@/lib/formatting";

describe("formatting", () => {
  it("formats currency with 2 decimals", () => {
    expect(formatCurrencyValue(1234.5)).toBe("$1,234.50");
    expect(formatCurrencyValue(0)).toBe("$0.00");
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(5)).toBe("5");
  });

  it("formats token counts", () => {
    expect(formatTokenCount(1234567)).toBe("1,234,567");
    expect(formatTokenCount(0)).toBe("0");
  });

  it("formats percentages", () => {
    expect(formatPercent(50)).toBe("50.0%");
    expect(formatPercent(33.333, 2)).toBe("33.33%");
  });

  it("formats relative dates", () => {
    expect(formatRelativeDate(new Date(Date.now() - 30 * 1000))).toBe("just now");
    expect(formatRelativeDate(new Date(Date.now() - 5 * 60 * 1000))).toBe("5 min ago");
  });

  it("formats latency", () => {
    expect(formatLatency(500)).toBe("500 ms");
    expect(formatLatency(2500)).toBe("2.50 s");
  });

  it("rounds to 2 decimals", () => {
    expect(round2(1.006)).toBe(1.01);
    expect(round2(1.004)).toBe(1);
  });
});
