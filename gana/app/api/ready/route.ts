import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { getEnv, isLiveAIConfigured } from "@/server/env";

export async function GET() {
  const checks: Record<string, { status: string; detail?: string }> = {};
  let overall = "ready";

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch {
    checks.database = { status: "unavailable", detail: "cannot connect" };
    overall = "not ready";
  }

  // AI provider (optional - not required for readiness)
  const env = getEnv();
  if (isLiveAIConfigured()) {
    checks.aiProvider = { status: "configured" };
  } else {
    checks.aiProvider = { status: "not configured", detail: "demo mode" };
  }

  return NextResponse.json(
    {
      status: overall,
      service: "ai-enablement-hub",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: overall === "ready" ? 200 : 503 }
  );
}
