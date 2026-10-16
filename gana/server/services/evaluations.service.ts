import { db } from "@/server/db/client";
import { EvaluationStatus, UsageDataType, Prisma } from "@prisma/client";
import { z } from "zod";

const RunSchema = z.object({
  scenarioId: z.string().min(1),
  userId: z.string().min(1),
  modelId: z.string().min(1),
  promptId: z.string().optional(),
});

export class EvaluationsService {
  async listScenarios() {
    return db.evaluationScenario.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        id: true, title: true, category: true, description: true,
        input: true, expectedOutcome: true, rubric: true,
        isAutomated: true, isSample: true, updatedAt: true,
      },
    });
  }

  async getScenario(id: string) {
    return db.evaluationScenario.findUnique({ where: { id } });
  }

  async createRun(data: z.infer<typeof RunSchema>) {
    const parsed = RunSchema.parse(data);
    // Mark as seeded/demo data clearly.
    return db.evaluationRun.create({
      data: {
        scenarioId: parsed.scenarioId,
        userId: parsed.userId,
        modelId: parsed.modelId,
        promptId: parsed.promptId ?? null,
        status: EvaluationStatus.PENDING,
        dataType: UsageDataType.SEEDED,
      },
    });
  }

  async getRun(id: string) {
    return db.evaluationRun.findUnique({
      where: { id },
      include: { scenario: true },
    });
  }

  async recordResult(id: string, data: {
    status: EvaluationStatus;
    output?: string | null;
    qualityScore?: number | null;
    passFail?: boolean | null;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number | null;
    estimatedCost?: number;
    notes?: string | null;
  }) {
    return db.evaluationRun.update({
      where: { id },
      data: {
        status: data.status,
        output: data.output ?? null,
        qualityScore: data.qualityScore != null ? new Prisma.Decimal(data.qualityScore) : null,
        passFail: data.passFail ?? null,
        inputTokens: data.inputTokens ?? 0,
        outputTokens: data.outputTokens ?? 0,
        latencyMs: data.latencyMs ?? null,
        estimatedCost: new Prisma.Decimal(data.estimatedCost ?? 0),
        notes: data.notes ?? null,
      },
    });
  }
}

export const evaluationsService = new EvaluationsService();
