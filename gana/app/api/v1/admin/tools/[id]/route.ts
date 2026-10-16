import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { withValidation } from "@/lib/api";
import { adminService } from "@/server/services/admin.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const body = await _req.json();
  const parsed = z.object({
    name: z.string().optional(),
    approvalStatus: z.string().optional(),
    dataHandling: z.string().optional(),
  }).parse(body);

  await adminService.logAudit({
    actorId: auth.userId,
    action: "admin.tool.update",
    targetType: "tool",
    targetId: id,
    metadata: parsed,
  });
  return NextResponse.json({ ok: true, id });
}
