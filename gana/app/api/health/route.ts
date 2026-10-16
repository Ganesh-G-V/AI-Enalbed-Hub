import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export async function GET() {
  let dbStatus = "ok";
  let dbDetail = null;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "unavailable";
    dbDetail = "database unreachable";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    service: "ai-enablement-hub",
    dependencies: { database: dbStatus },
    timestamp: new Date().toISOString(),
  });
}
