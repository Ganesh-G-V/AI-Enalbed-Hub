import { db } from "@/server/db/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const AuditSchema = z.object({
  actorId: z.string().optional(),
  action: z.string().min(1).max(200),
  targetType: z.string().min(1).max(100),
  targetId: z.string().min(1).max(200),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export class AdminService {
  async logAudit(data: z.infer<typeof AuditSchema>) {
    const parsed = AuditSchema.parse(data);
    return db.auditEvent.create({
      data: {
        actorId: parsed.actorId ?? null,
        action: parsed.action,
        targetType: parsed.targetType,
        targetId: parsed.targetId,
        metadata: parsed.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async listAudit({ page = 1, pageSize = 50 }: { page?: number; pageSize?: number } = {}) {
    const [events, total] = await Promise.all([
      db.auditEvent.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, email: true, name: true } } },
      }),
      db.auditEvent.count(),
    ]);
    return { events, total };
  }

  async listSettings() {
    return db.appSetting.findMany({ orderBy: { key: "asc" } });
  }

  async upsertSetting(key: string, value: string, description?: string) {
    return db.appSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }
}

export const adminService = new AdminService();
