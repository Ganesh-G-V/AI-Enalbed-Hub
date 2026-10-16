import { AIProvider, ChatRequest, ChatResponse, UsageMetadata } from "./provider";

export class MockProvider implements AIProvider {
  provider = "mock";
  isMock = true;

  constructor(private defaultModel = "mock-model") {}

  isAvailable(): boolean {
    return true;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    // Deterministic simulated latency between 300-900ms based on input length.
    const simulatedLatency = 300 + (request.messages.reduce((a, m) => a + m.content.length, 0) % 600);
    await new Promise((r) => setTimeout(r, Math.min(simulatedLatency, 500)));

    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const userText = lastUser?.content ?? "";
    const inputTokens = estimateTokens(userText + request.messages.reduce((a: number, m: { content: string }) => a + m.content.length, 0));
    const outputText = this.generateResponse(userText);
    const outputTokens = estimateTokens(outputText);
    const latencyMs = Date.now() - start;

    return {
      text: outputText,
      provider: this.provider,
      model: request.model ?? this.defaultModel,
      usage: {
        inputTokens,
        outputTokens,
        latencyMs,
        requestId: request.requestId ?? `mock_${Date.now()}`,
      },
      isMock: true,
    };
  }

  private generateResponse(userText: string): string {
    const lower = userText.toLowerCase();
    if (lower.includes("code") || lower.includes("program")) {
      return "// Mock AI response\nfunction example() {\n  // This is a deterministic mock response.\n  // No external provider was called.\n  return \"hello\";\n}\n";
    }
    if (lower.includes("test")) {
      return "describe('example', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});\n";
    }
    if (lower.includes("sql")) {
      return "SELECT * FROM example WHERE active = true LIMIT 10;\n";
    }
    return "This is a deterministic mock response from the AI Enablement Hub demo provider. No live model was invoked.";
  }
}

function estimateTokens(text: string): number {
  // Rough deterministic estimate: ~4 characters per token.
  return Math.max(1, Math.ceil(text.length / 4));
}
