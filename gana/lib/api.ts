import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
}

export function errorResponse(message: string, status = 400, code?: string): NextResponse {
  const body: ApiError = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

export function validationErrorResponse(err: ZodError): NextResponse {
  return errorResponse(
    "Validation failed",
    400,
    "validation_error"
  ) as unknown as NextResponse & { details?: unknown };
}

/**
 * Wrap a route handler with Zod validation of the request body and consistent
 * error handling. Never exposes stack traces to the client.
 */
export function withValidation<S extends ZodSchema, T>(
  schema: S,
  handler: (req: NextRequest, validated: z.infer<S>, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    let validated: z.infer<S>;
    try {
      const body = await req.json();
      validated = schema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return errorResponse("Invalid request body", 400);
    }
    try {
      return await handler(req, validated, context);
    } catch (err) {
      console.error("[API] handler error:", err);
      return errorResponse("Internal server error", 500);
    }
  };
}

import { z } from "zod";

export function withQueryValidation<S extends ZodSchema, T>(
  schema: S,
  handler: (req: NextRequest, validated: z.infer<S>, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const { searchParams } = new URL(req.url);
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    let validated: z.infer<S>;
    try {
      validated = schema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return errorResponse("Invalid query parameters", 400);
    }
    try {
      return await handler(req, validated, context);
    } catch (err) {
      console.error("[API] handler error:", err);
      return errorResponse("Internal server error", 500);
    }
  };
}

export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function paginatedResponse<T>(items: T[], total: number, page: number, pageSize: number) {
  return successResponse({
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
}
