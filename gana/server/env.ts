import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database URL"),
  APP_BASE_URL: z.string().url().optional().default("http://localhost:3000"),
  AI_PROVIDER: z.enum(["mock", "anthropic", "openai", "none"]).default("mock"),
  AI_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().optional().default("mock-model"),
  AUTH_MODE: z.enum(["none", "oidc", "session"]).default("none"),
  AUTH_ISSUER_URL: z.string().url().optional(),
  AUTH_CLIENT_ID: z.string().optional(),
  AUTH_CLIENT_SECRET: z.string().optional(),
  USAGE_LIMIT_PER_USER: z.string().regex(/^\d+$/).optional().default("1000"),
  MAX_OUTPUT_TOKENS: z.string().regex(/^\d+$/).optional().default("4096"),
  ENABLE_DEMO_MODE: z.string().optional().default("true"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (env) return env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = Object.keys(result.error.flatten().fieldErrors);
    // In development, optional AI credentials are allowed to be missing.
    const requiredMissing = missing.filter(
      (k) => !["AI_API_KEY", "AI_DEFAULT_MODEL", "AUTH_ISSUER_URL", "AUTH_CLIENT_ID", "AUTH_CLIENT_SECRET"].includes(k)
    );
    if (requiredMissing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${requiredMissing.join(", ")}`
      );
    }
    // Fall back to defaults for optional AI/auth vars.
    env = envSchema.parse({
      ...process.env,
      ...Object.fromEntries(missing.map((k) => [k, undefined])),
    });
    return env;
  }
  env = result.data;
  return env;
}

export function isDemoMode(): boolean {
  return getEnv().ENABLE_DEMO_MODE === "true";
}

export function isLiveAIConfigured(): boolean {
  const e = getEnv();
  return e.AI_PROVIDER !== "none" && e.AI_PROVIDER !== "mock" && Boolean(e.AI_API_KEY);
}

export function isAuthConfigured(): boolean {
  return getEnv().AUTH_MODE !== "none" && Boolean(getEnv().AUTH_ISSUER_URL);
}

export function isDemoUser(email?: string | null): boolean {
  return Boolean(email && email.endsWith("@example.ai-hub.demo"));
}
