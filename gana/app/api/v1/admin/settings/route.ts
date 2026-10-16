import { NextResponse } from "next/server";
import { withQueryValidation } from "@/lib/api";
import { adminService } from "@/server/services/admin.service";
import { z } from "zod";

const ListSettingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

export const GET = withQueryValidation(ListSettingsSchema, async (_req, validated) => {
  const settings = await adminService.listSettings();
  return NextResponse.json({ items: settings, total: settings.length, page: validated.page, pageSize: validated.pageSize, pageCount: 1 });
});

const UpsertSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string(),
  description: z.string().optional(),
});

export const POST = async (req: Request) => {
  const body = await req.json();
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const setting = await adminService.upsertSetting(parsed.data.key, parsed.data.value, parsed.data.description);
  return NextResponse.json(setting);
};
