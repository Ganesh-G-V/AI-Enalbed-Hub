export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  maxOutputTokens?: number;
  responseFormat?: "text" | "json";
  temperature?: number;
  requestId?: string;
}

export interface UsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  latencyMs: number;
  requestId?: string;
}

export interface ChatResponse {
  text: string;
  provider: string;
  model: string;
  usage: UsageMetadata;
  isMock: boolean;
}

export interface AIProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  isAvailable(): boolean;
  isMock: boolean;
}

export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  defaultModel?: string;
}
