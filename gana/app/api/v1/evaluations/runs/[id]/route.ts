import { NextResponse } from "next/server";
import { evaluationsService } from "@/server/services/evaluations.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = await evaluationsService.getRun(id);
  if (!run) return NextResponse.json({ error: "Evaluation run not found" }, { status: 404 });
  return NextResponse.json(run);
}
