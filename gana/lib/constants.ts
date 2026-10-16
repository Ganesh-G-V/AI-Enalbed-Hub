export const APP_NAME = "AI Enablement Hub";
export const APP_DESCRIPTION =
  "Centralized platform for AI tool selection, prompt governance, cost optimization, and adoption analytics.";

export enum TaskCategory {
  CODING = "coding",
  DEBUGGING = "debugging",
  TESTING = "testing",
  CODE_REVIEW = "code_review",
  ARCHITECTURE = "architecture",
  DATA_ANALYSIS = "data_analysis",
  SQL = "sql",
  DOCUMENTATION = "documentation",
  RESEARCH = "research",
  SUMMARIZATION = "summarization",
  KNOWLEDGE_RETRIEVAL = "knowledge_retrieval",
  CUSTOMER_SUPPORT = "customer_support",
}

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  [TaskCategory.CODING]: "Coding",
  [TaskCategory.DEBUGGING]: "Debugging",
  [TaskCategory.TESTING]: "Testing",
  [TaskCategory.CODE_REVIEW]: "Code review",
  [TaskCategory.ARCHITECTURE]: "Architecture",
  [TaskCategory.DATA_ANALYSIS]: "Data analysis",
  [TaskCategory.SQL]: "SQL",
  [TaskCategory.DOCUMENTATION]: "Documentation",
  [TaskCategory.RESEARCH]: "Research",
  [TaskCategory.SUMMARIZATION]: "Summarization",
  [TaskCategory.KNOWLEDGE_RETRIEVAL]: "Knowledge retrieval",
  [TaskCategory.CUSTOMER_SUPPORT]: "Customer support",
};

export enum DataClassification {
  PUBLIC = "public",
  INTERNAL = "internal",
  CONFIDENTIAL = "confidential",
  RESTRICTED = "restricted",
}

export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  [DataClassification.PUBLIC]: "Public",
  [DataClassification.INTERNAL]: "Internal",
  [DataClassification.CONFIDENTIAL]: "Confidential",
  [DataClassification.RESTRICTED]: "Restricted",
};

export enum ApprovalStatus {
  APPROVED = "approved",
  PENDING = "pending",
  RESTRICTED = "restricted",
  DECLINED = "declined",
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  [ApprovalStatus.APPROVED]: "Approved",
  [ApprovalStatus.PENDING]: "Pending review",
  [ApprovalStatus.RESTRICTED]: "Restricted",
  [ApprovalStatus.DECLINED]: "Declined",
};

export enum UserRole {
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}

export enum FeedbackRating {
  HELPFUL = "helpful",
  NOT_HELPFUL = "not_helpful",
}

export enum EvaluationStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum UsageDataType {
  ACTUAL = "actual",
  ESTIMATED = "estimated",
  SEEDED = "seeded",
}

export const DEMO_MODE_NOTICE =
  "Demo mode: displaying seeded sample data. No live AI provider is configured.";

export const SIDEBAR_NAV = [
  { name: "AI Hub", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", group: "core" },
  { name: "AI Tool Finder", href: "/tools", icon: "Cpu", group: "core" },
  { name: "Prompt Library", href: "/prompts", icon: "FileText", group: "core" },
  { name: "Token & Cost Lab", href: "/token-lab", icon: "Calculator", group: "core" },
  { name: "Knowledge Center", href: "/knowledge", icon: "BookOpen", group: "core" },
  { name: "Knowledge Assistant", href: "/assistant", icon: "MessageCircle", group: "core" },
  { name: "Evaluation Lab", href: "/evaluations", icon: "FlaskConical", group: "core" },
  { name: "Analytics", href: "/analytics", icon: "BarChart", group: "core" },
  { name: "Admin Settings", href: "/admin", icon: "Settings", group: "admin" },
] as const;
