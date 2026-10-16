import { NextResponse } from "next/server";
import { z } from "zod";
import { withQueryValidation } from "@/lib/api";
import { adminService } from "@/server/services/admin.service";
import { resolveAuth, requireAdmin } from "@/lib/auth";

const q = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("50"),
});

export const GET = withQueryValidation(q, async (_req, validated) => {
  const auth = resolveAuth(_req);
  const adminErr = requireAdmin(auth);
  if (adminErr) return adminErr;

  const page = parseInt(validated.page, 10);
  const pageSize = parseInt(validated.pageSize, 10);
  const { events, total } = await adminService.listAudit({ page, pageSize });
  return NextResponse.json({
    items: events,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});
