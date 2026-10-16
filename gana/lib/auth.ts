import { NextRequest, NextResponse } from "next/server";
import { getEnv, isAuthConfigured, isDemoUser } from "@/server/env";

export interface AuthedRequest {
  userId: string;
  userRole: string;
  isDemo: boolean;
  isAuthenticated: boolean;
}

/**
 * Resolve the caller identity. In local dev (AUTH_MODE=none) we fall back to a
 * demo user identified by an optional x-user-id header. We never trust a
 * client-controlled role for authorization unless auth is genuinely configured.
 */
export function resolveAuth(req: NextRequest): AuthedRequest {
  const env = getEnv();
  const isDemo = env.AUTH_MODE === "none" || !isAuthConfigured();
  const headerUserId = req.headers.get("x-user-id");
  const headerRole = req.headers.get("x-user-role");

  if (isDemo) {
    return {
      userId: headerUserId || "demo-user-0000",
      userRole: headerUserId ? (headerRole || "member") : "member",
      isDemo: true,
      isAuthenticated: false,
    };
  }

  // Production auth path (OIDC/session) would populate user from a verified
  // session cookie or JWT. Integration point only; real verification depends on
  // the configured identity provider.
  return {
    userId: headerUserId || "unauthenticated",
    userRole: headerRole || "viewer",
    isDemo: false,
    isAuthenticated: false,
  };
}

export function requireAdmin(auth: AuthedRequest): NextResponse | null {
  if (auth.isDemo) {
    // In demo mode, allow admin only if explicitly an admin demo user via header.
    if (auth.userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
    }
    return null;
  }
  if (!auth.isAuthenticated || auth.userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
  }
  return null;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
