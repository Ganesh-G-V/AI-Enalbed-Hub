import { db } from "@/server/db/client";
import { Tool, TaskCategory, ApprovalStatus, DataClassification } from "@prisma/client";

export interface RecommendationRequest {
  taskCategory: TaskCategory;
  role: string;
  description: string;
  dataClassification: DataClassification;
  preference: "lowest_cost" | "balanced" | "highest_capability" | "lowest_latency";
}

export interface RecommendationResult {
  recommendedCategory: TaskCategory;
  eligible: Array<{
    id: string;
    name: string;
    provider: string;
    category: TaskCategory;
    approvalStatus: ApprovalStatus;
    fitReason: string;
    cost?: string;
    latency?: string;
    dataHandling: string;
    docsUrl?: string | null;
  }>;
  warnings: string[];
  alternatives: string[];
  verificationChecklist: string[];
  relatedPrompts: Array<{ id: string; title: string }>;
}

const ALLOWED_FOR_CLASSIFICATION: Record<DataClassification, ApprovalStatus[]> = {
  [DataClassification.PUBLIC]: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING],
  [DataClassification.INTERNAL]: [ApprovalStatus.APPROVED],
  [DataClassification.CONFIDENTIAL]: [ApprovalStatus.APPROVED],
  [DataClassification.RESTRICTED]: [ApprovalStatus.APPROVED],
};

export class RecommendationService {
  async recommend(request: RecommendationRequest): Promise<RecommendationResult> {
    const { taskCategory, role, description, dataClassification, preference } = request;

    const allowedStatuses = ALLOWED_FOR_CLASSIFICATION[dataClassification];

    // Fetch eligible catalogue entries: match category, allowed approval status, and
    // never recommend a tool not approved for the given data classification.
    const tools = await db.tool.findMany({
      where: {
        isCatalogueEntry: true,
        category: taskCategory,
        approvalStatus: { in: allowedStatuses },
      },
      orderBy: { name: "asc" },
    });

    const warnings: string[] = [];
    const alternatives: string[] = [];

    // Data sensitivity warnings.
    if (dataClassification === DataClassification.RESTRICTED) {
      warnings.push("Restricted data: only use tools explicitly approved for Restricted classification.");
    } else if (dataClassification === DataClassification.CONFIDENTIAL) {
      warnings.push("Confidential data: confirm the tool's data handling guidance before sharing source code or customer data.");
    }

    // Never send sensitive data to non-approved providers.
    const nonApproved = tools.filter((t) => t.approvalStatus !== ApprovalStatus.APPROVED);
    if (nonApproved.length > 0 && dataClassification !== DataClassification.PUBLIC) {
      warnings.push("Some eligible tools are not fully approved for this data classification.");
    }

    if (tools.length === 0) {
      alternatives.push("Contact the AI governance team to request a tool evaluation for this task category.");
      alternatives.push("Consider a manual review or an approved general-purpose writing assistant for Public data only.");
      return {
        recommendedCategory: taskCategory,
        eligible: [],
        warnings: ["No eligible approved tool exists for this task and data classification combination."],
        alternatives,
        verificationChecklist: [
          "Confirm task category with your technical lead.",
          "Request tool approval via the AI governance intake.",
          "Do not paste sensitive data into unapproved tools.",
        ],
        relatedPrompts: [],
      };
    }

    // Sort by preference.
    const sorted = [...tools];
    if (preference === "lowest_cost") {
      // Cost data not always verified; sort by name deterministically as a stable fallback.
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (preference === "highest_capability") {
      sorted.sort((a, b) => b.capabilities.length - a.capabilities.length || a.name.localeCompare(b.name));
    } else if (preference === "lowest_latency") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    const eligible = sorted.map((t) => ({
      id: t.id,
      name: t.name,
      provider: t.provider,
      category: t.category,
      approvalStatus: t.approvalStatus,
      fitReason: this.buildFitReason(t, taskCategory, role, description, preference),
      cost: "Contact provider for current pricing",
      latency: "Varies by provider and request volume",
      dataHandling: t.dataHandling,
      docsUrl: t.docsUrl,
    }));

    const verificationChecklist = [
      "Confirm the tool is approved for your data classification.",
      "Review the tool's data handling guidance.",
      "Validate model outputs before using in production.",
      "Check the provider's current pricing and terms.",
    ];

    const relatedPrompts = await db.promptTemplate.findMany({
      where: { category: taskCategory, isPublished: true },
      take: 3,
      select: { id: true, title: true },
    });

    return {
      recommendedCategory: taskCategory,
      eligible,
      warnings,
      alternatives,
      verificationChecklist,
      relatedPrompts: relatedPrompts.map((p) => ({ id: p.id, title: p.title })),
    };
  }

  private buildFitReason(
    tool: Tool,
    taskCategory: TaskCategory,
    role: string,
    description: string,
    preference: string
  ): string {
    const caps = tool.capabilities.slice(0, 3).join(", ");
    return `${tool.name} (${tool.provider}) supports ${taskCategory} with capabilities such as ${caps}. Suitable for ${role} work focusing on ${description.slice(0, 60)}. Preference: ${preference.replace("_", " ")}.`;
  }
}

export const recommendationService = new RecommendationService();
