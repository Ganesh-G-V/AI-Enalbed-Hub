import { AIProvider, ChatRequest, ChatResponse, ProviderConfig } from "./provider";
import { MockProvider } from "./mock-provider";
import { isLiveAIConfigured, getEnv } from "../env";

export function createProvider(config?: ProviderConfig): AIProvider {
  const env = getEnv();
  const providerName = config?.provider ?? env.AI_PROVIDER;

  if (providerName === "mock" || !isLiveAIConfigured()) {
    return new MockProvider(config?.defaultModel ?? env.AI_DEFAULT_MODEL);
  }

  switch (providerName) {
    case "anthropic":
      return new AnthropicProvider(config?.apiKey ?? env.AI_API_KEY!, config?.defaultModel ?? env.AI_DEFAULT_MODEL);
    case "openai":
      return new OpenAIProvider(config?.apiKey ?? env.AI_API_KEY!, config?.defaultModel ?? env.AI_DEFAULT_MODEL);
    default:
      return new MockProvider(config?.defaultModel ?? env.AI_DEFAULT_MODEL);
  }
}

export function createDefaultProvider(): AIProvider {
  return createProvider();
}

class AnthropicProvider implements AIProvider {
  provider = "anthropic";
  isMock = false;
  private client: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(private apiKey: string, private defaultModel: string) {
    this.client = null;
  }

  private async getClient() {
    if (this.client) return this.client;
    const { Anthropic } = await import("@anthropic-ai/sdk");
    this.client = new Anthropic({ apiKey: this.apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const client = await this.getClient();
    const model = request.model ?? this.defaultModel;
    const system = request.messages.find((m) => m.role === "system")?.content;
    const messages = request.messages.filter((m) => m.role !== "system");

    const response = await client.messages.create({
      model,
      max_tokens: request.maxOutputTokens ?? 1024,
      system,
      messages: messages as any,
    });

    const text = response.content.map((c: any) => c.type === "text" ? c.text : "").join("");
    const usage = response.usage;

    return {
      text,
      provider: this.provider,
      model: response.model ?? model,
      usage: {
        inputTokens: usage?.input_tokens,
        outputTokens: usage?.output_tokens,
        latencyMs: Date.now() - start,
        requestId: response.id,
      },
      isMock: false,
    };
  }
}

class OpenAIProvider implements AIProvider {
  provider = "openai";
  isMock = false;
  private client: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(private apiKey: string, private defaultModel: string) {
    this.client = null;
  }

  private async getClient() {
    if (this.client) return this.client;
    const { OpenAI } = await import("openai");
    this.client = new OpenAI({ apiKey: this.apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const client = await this.getClient();
    const model = request.model ?? this.defaultModel;

    const response = await client.chat.completions.create({
      model,
      messages: request.messages as any,
      max_completion_tokens: request.maxOutputTokens,
      temperature: request.temperature,
      response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const usage = response.usage;

    return {
      text,
      provider: this.provider,
      model: response.model ?? model,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        latencyMs: Date.now() - start,
        requestId: response.id,
      },
      isMock: false,
    };
  }
}
