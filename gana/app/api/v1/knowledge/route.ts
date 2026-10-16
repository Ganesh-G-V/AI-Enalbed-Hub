import { NextResponse } from "next/server";
import { withQueryValidation } from "@/lib/api";
import { knowledgeService } from "@/server/services/knowledge.service";
import { z } from "zod";

const ListKnowledgeSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
});

export const GET = withQueryValidation(ListKnowledgeSchema, async (_req, validated) => {
  const result = await knowledgeService.list(
    { category: validated.category, search: validated.search, role: validated.role },
    { page: validated.page, pageSize: validated.pageSize },
  );
  return NextResponse.json(result);
});
