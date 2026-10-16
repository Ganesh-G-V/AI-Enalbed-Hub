-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'RESTRICTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('CODING', 'DEBUGGING', 'TESTING', 'CODE_REVIEW', 'ARCHITECTURE', 'DATA_ANALYSIS', 'SQL', 'DOCUMENTATION', 'RESEARCH', 'SUMMARIZATION', 'KNOWLEDGE_RETRIEVAL', 'CUSTOMER_SUPPORT');

-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('HELPFUL', 'NOT_HELPFUL');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UsageDataType" AS ENUM ('ACTUAL', 'ESTIMATED', 'SEEDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "avatarUrl" TEXT,
    "isDemoUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "capabilities" TEXT[],
    "supportedTasks" TEXT[],
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "dataHandling" TEXT NOT NULL,
    "docsUrl" TEXT,
    "limitations" TEXT,
    "recommendedUseCases" TEXT[],
    "lastReviewedAt" TIMESTAMPTZ,
    "isCatalogueEntry" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "supportsCaching" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPricing" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveAt" TIMESTAMPTZ NOT NULL,
    "inputRatePerMillion" DECIMAL(12,6) NOT NULL,
    "outputRatePerMillion" DECIMAL(12,6) NOT NULL,
    "cachedInputRatePerMillion" DECIMAL(12,6),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source" TEXT NOT NULL,
    "assumptions" TEXT NOT NULL,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "inputPlaceholders" TEXT[],
    "exampleInput" TEXT,
    "exampleOutput" TEXT,
    "instructions" TEXT,
    "expectedOutputFormat" TEXT,
    "commonFailureModes" TEXT,
    "qualityChecklist" TEXT,
    "applicableRole" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isEditableByAdmin" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastReviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "version" TEXT NOT NULL,
    "reviewedAt" TIMESTAMPTZ,
    "nextReviewAt" TIMESTAMPTZ,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "roleAccess" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "toolId" TEXT,
    "modelId" TEXT,
    "category" "TaskCategory",
    "dataClassification" "DataClassification",
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(12,6),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dataType" "UsageDataType" NOT NULL DEFAULT 'SEEDED',
    "latencyMs" INTEGER,
    "provider" TEXT,
    "requestId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" "FeedbackRating" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutcome" TEXT,
    "rubric" TEXT NOT NULL,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationRun" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptId" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "qualityScore" DECIMAL(5,2),
    "passFail" BOOLEAN,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "estimatedCost" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dataType" "UsageDataType" NOT NULL DEFAULT 'SEEDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Tool_category_idx" ON "Tool"("category");

-- CreateIndex
CREATE INDEX "Tool_approvalStatus_idx" ON "Tool"("approvalStatus");

-- CreateIndex
CREATE INDEX "Tool_provider_idx" ON "Tool"("provider");

-- CreateIndex
CREATE INDEX "ModelProfile_provider_idx" ON "ModelProfile"("provider");

-- CreateIndex
CREATE INDEX "ModelProfile_isApproved_idx" ON "ModelProfile"("isApproved");

-- CreateIndex
CREATE INDEX "ModelPricing_modelId_idx" ON "ModelPricing"("modelId");

-- CreateIndex
CREATE INDEX "ModelPricing_isCurrent_idx" ON "ModelPricing"("isCurrent");

-- CreateIndex
CREATE INDEX "ModelPricing_effectiveAt_idx" ON "ModelPricing"("effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModelPricing_modelId_version_key" ON "ModelPricing"("modelId", "version");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");

-- CreateIndex
CREATE INDEX "PromptTemplate_isPublished_idx" ON "PromptTemplate"("isPublished");

-- CreateIndex
CREATE INDEX "PromptFavorite_userId_idx" ON "PromptFavorite"("userId");

-- CreateIndex
CREATE INDEX "PromptFavorite_promptId_idx" ON "PromptFavorite"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptFavorite_userId_promptId_key" ON "PromptFavorite"("userId", "promptId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_category_idx" ON "KnowledgeDocument"("category");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_isPublished_idx" ON "KnowledgeDocument"("isPublished");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_isSample_idx" ON "KnowledgeDocument"("isSample");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- CreateIndex
CREATE INDEX "UsageEvent_toolId_idx" ON "UsageEvent"("toolId");

-- CreateIndex
CREATE INDEX "UsageEvent_category_idx" ON "UsageEvent"("category");

-- CreateIndex
CREATE INDEX "UsageEvent_dataType_idx" ON "UsageEvent"("dataType");

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_success_idx" ON "UsageEvent"("success");

-- CreateIndex
CREATE INDEX "Feedback_targetType_targetId_idx" ON "Feedback"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "EvaluationScenario_category_idx" ON "EvaluationScenario"("category");

-- CreateIndex
CREATE INDEX "EvaluationScenario_isSample_idx" ON "EvaluationScenario"("isSample");

-- CreateIndex
CREATE INDEX "EvaluationRun_scenarioId_idx" ON "EvaluationRun"("scenarioId");

-- CreateIndex
CREATE INDEX "EvaluationRun_status_idx" ON "EvaluationRun"("status");

-- CreateIndex
CREATE INDEX "EvaluationRun_createdAt_idx" ON "EvaluationRun"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "AppSetting_key_idx" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "ModelPricing" ADD CONSTRAINT "ModelPricing_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptFavorite" ADD CONSTRAINT "PromptFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptFavorite" ADD CONSTRAINT "PromptFavorite_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRun" ADD CONSTRAINT "EvaluationRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationRun" ADD CONSTRAINT "EvaluationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
