import { NextResponse } from "next/server";
import { knowledgeService } from "@/server/services/knowledge.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await knowledgeService.getById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json(doc);
}
