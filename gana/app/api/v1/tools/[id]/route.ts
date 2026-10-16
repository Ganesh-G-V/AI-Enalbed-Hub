import { NextResponse } from "next/server";
import { toolsService } from "@/server/services/tools.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tool = await toolsService.getById(id);
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  return NextResponse.json(tool);
}
