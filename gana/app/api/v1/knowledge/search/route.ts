import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { knowledgeService } from "@/server/services/knowledge.service";
import { resolveAuth } from "@/lib/auth";

const querySchema = z.object({
  q: z.string().min(1),
  role: z.string().default("member"),
  limit: z.string().optional().default("5"),
});

export const GET = withQueryValidation(querySchema, async (_req, validated, context) => {
  const auth = resolveAuth(_req);
  const limit = parseInt(validated.limit, 10);
  const results = await knowledgeService.search(validated.q, auth.userRole, limit);
  return NextResponse.json({ query: validated.q, results, role: auth.userRole });
});
