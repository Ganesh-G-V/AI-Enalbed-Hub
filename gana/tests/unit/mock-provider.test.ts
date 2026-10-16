import { describe, it, expect } from "vitest";
import { createProvider } from "@/server/ai/provider-factory";

describe("mock provider", () => {
  it("returns a deterministic response with usage metadata", async () => {
    const provider = createProvider({ provider: "mock", defaultModel: "mock-model" });
    expect(provider.isAvailable()).toBe(true);
    expect(provider.isMock).toBe(true);

    const res = await provider.chat({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Write a unit test for a sum function." },
      ],
      maxOutputTokens: 256,
      requestId: "test-req-1",
    });

    expect(typeof res.text).toBe("string");
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.provider).toBe("mock");
    expect(res.isMock).toBe(true);
    expect(res.usage.requestId).toBe("test-req-1");
    expect(typeof res.usage.inputTokens).toBe("number");
    expect(typeof res.usage.outputTokens).toBe("number");
    expect(typeof res.usage.latencyMs).toBe("number");
    expect(res.usage.latencyMs).toBeGreaterThan(0);
  });

  it("is deterministic for the same input", async () => {
    const provider = createProvider({ provider: "mock" });
    const a = await provider.chat({
      messages: [{ role: "user", content: "hello world" }],
    });
    const b = await provider.chat({
      messages: [{ role: "user", content: "hello world" }],
    });
    expect(a.text).toBe(b.text);
    expect(a.usage.inputTokens).toBe(b.usage.inputTokens);
    expect(a.usage.outputTokens).toBe(b.usage.outputTokens);
  });
});
