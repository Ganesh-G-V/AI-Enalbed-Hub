-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PROVIDER_API', 'PRICING_PAGE', 'RELEASE_NOTES', 'DEPRECATION_NOTICE', 'RSS_FEED', 'ATOM_FEED', 'BENCHMARK_REPORT', 'RESEARCH_PUBLICATION', 'INTERNAL_REGISTRY');

-- CreateEnum
CREATE TYPE "SourceReliability" AS ENUM ('VERIFIED', 'REPUTABLE', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('NEW_MODEL', 'NEW_VERSION', 'RELEASED', 'PREVIEW_TO_STABLE', 'CAPABILITY_ADDED', 'CAPABILITY_REMOVED', 'PRICING_CHANGE', 'CONTEXT_WINDOW_CHANGE', 'DEPRECATION', 'SHUTDOWN', 'API_CHANGE', 'PROVIDER_AVAILABILITY_CHANGE', 'CONFLICTING_CLAIM');

-- CreateEnum
CREATE TYPE "ChangeReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CORRECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('ANNOUNCED', 'PREVIEW', 'GENERAL_AVAILABILITY', 'DEPRECATED', 'SHUTDOWN');

-- AlterTable
ALTER TABLE "ModelPricing" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationSource" TEXT;

-- AlterTable
ALTER TABLE "ModelProfile" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "deprecationDate" TIMESTAMPTZ,
ADD COLUMN     "lastVerifiedAt" TIMESTAMPTZ,
ADD COLUMN     "lifecycleStatus" "LifecycleStatus" NOT NULL DEFAULT 'ANNOUNCED',
ADD COLUMN     "releaseDate" TIMESTAMPTZ,
ADD COLUMN     "shutdownDate" TIMESTAMPTZ,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "lastVerifiedAt" TIMESTAMPTZ,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';

-- CreateTable
CREATE TABLE "SourceRegistry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "config" JSON,
    "authSecretRef" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pollIntervalMs" INTEGER NOT NULL DEFAULT 3600000,
    "lastSuccessfulSync" TIMESTAMPTZ,
    "lastAttemptedSync" TIMESTAMPTZ,
    "nextScheduledSync" TIMESTAMPTZ,
    "health" TEXT NOT NULL DEFAULT 'unknown',
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitRemaining" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "reliability" "SourceReliability" NOT NULL DEFAULT 'UNVERIFIED',
    "extractionMethod" TEXT NOT NULL DEFAULT 'api',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT,
    "contentHash" TEXT,
    "etag" TEXT,
    "lastModified" TIMESTAMPTZ,
    "publishedAt" TIMESTAMPTZ,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSON,
    "rawPayload" JSON,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cron" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeoutMs" INTEGER NOT NULL DEFAULT 300000,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "backoffBaseMs" INTEGER NOT NULL DEFAULT 1000,
    "lastRunId" TEXT,
    "nextRunAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "durationMs" INTEGER,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsInserted" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryAttempt" INTEGER NOT NULL DEFAULT 0,
    "logs" JSON,
    "etag" TEXT,
    "contentHash" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeEvent" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "oldValue" JSON,
    "newValue" JSON,
    "diff" TEXT,
    "sourceEvidence" TEXT NOT NULL,
    "sourcePublicationDate" TIMESTAMPTZ,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "reviewStatus" "ChangeReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "reviewNotes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "previousVerifiedValue" JSON,

    CONSTRAINT "ChangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelDeprecation" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "announcedAt" TIMESTAMPTZ,
    "deprecationDate" TIMESTAMPTZ,
    "shutdownDate" TIMESTAMPTZ,
    "reason" TEXT,
    "migrationGuide" TEXT,
    "replacementModel" TEXT,
    "sourceUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ModelDeprecation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkResult" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "benchmarkName" TEXT NOT NULL,
    "benchmarkVersion" TEXT,
    "score" DOUBLE PRECISION,
    "category" TEXT NOT NULL,
    "conditions" TEXT,
    "date" TIMESTAMPTZ,
    "sourceUrl" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSON,

    CONSTRAINT "BenchmarkResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "taskCategory" TEXT NOT NULL,
    "dataClassification" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskCategory" TEXT NOT NULL,
    "dataClassification" TEXT NOT NULL,
    "recommendedModelId" TEXT NOT NULL,
    "recommendedModelName" TEXT NOT NULL,
    "recommendedProvider" TEXT NOT NULL,
    "fitReason" TEXT NOT NULL,
    "alternatives" JSON,
    "estimatedCost" DECIMAL(12,6),
    "costAssumptions" TEXT,
    "approvalStatus" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "evidence" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceRegistry_provider_idx" ON "SourceRegistry"("provider");

-- CreateIndex
CREATE INDEX "SourceRegistry_type_idx" ON "SourceRegistry"("type");

-- CreateIndex
CREATE INDEX "SourceRegistry_enabled_idx" ON "SourceRegistry"("enabled");

-- CreateIndex
CREATE INDEX "SourceRegistry_nextScheduledSync_idx" ON "SourceRegistry"("nextScheduledSync");

-- CreateIndex
CREATE INDEX "SourceDocument_sourceId_idx" ON "SourceDocument"("sourceId");

-- CreateIndex
CREATE INDEX "SourceDocument_externalId_idx" ON "SourceDocument"("externalId");

-- CreateIndex
CREATE INDEX "SourceDocument_retrievedAt_idx" ON "SourceDocument"("retrievedAt");

-- CreateIndex
CREATE INDEX "SourceDocument_contentHash_idx" ON "SourceDocument"("contentHash");

-- CreateIndex
CREATE INDEX "IngestionJob_sourceId_idx" ON "IngestionJob"("sourceId");

-- CreateIndex
CREATE INDEX "IngestionJob_enabled_idx" ON "IngestionJob"("enabled");

-- CreateIndex
CREATE INDEX "IngestionJob_nextRunAt_idx" ON "IngestionJob"("nextRunAt");

-- CreateIndex
CREATE INDEX "IngestionRun_jobId_idx" ON "IngestionRun"("jobId");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");

-- CreateIndex
CREATE INDEX "ChangeEvent_sourceId_idx" ON "ChangeEvent"("sourceId");

-- CreateIndex
CREATE INDEX "ChangeEvent_entityType_idx" ON "ChangeEvent"("entityType");

-- CreateIndex
CREATE INDEX "ChangeEvent_changeType_idx" ON "ChangeEvent"("changeType");

-- CreateIndex
CREATE INDEX "ChangeEvent_reviewStatus_idx" ON "ChangeEvent"("reviewStatus");

-- CreateIndex
CREATE INDEX "ChangeEvent_detectedAt_idx" ON "ChangeEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "ChangeEvent_published_idx" ON "ChangeEvent"("published");

-- CreateIndex
CREATE INDEX "ModelDeprecation_modelId_idx" ON "ModelDeprecation"("modelId");

-- CreateIndex
CREATE INDEX "ModelDeprecation_provider_idx" ON "ModelDeprecation"("provider");

-- CreateIndex
CREATE INDEX "ModelDeprecation_isActive_idx" ON "ModelDeprecation"("isActive");

-- CreateIndex
CREATE INDEX "BenchmarkResult_modelId_idx" ON "BenchmarkResult"("modelId");

-- CreateIndex
CREATE INDEX "BenchmarkResult_benchmarkName_idx" ON "BenchmarkResult"("benchmarkName");

-- CreateIndex
CREATE INDEX "BenchmarkResult_date_idx" ON "BenchmarkResult"("date");

-- CreateIndex
CREATE INDEX "RecommendationRule_taskCategory_idx" ON "RecommendationRule"("taskCategory");

-- CreateIndex
CREATE INDEX "RecommendationRule_dataClassification_idx" ON "RecommendationRule"("dataClassification");

-- CreateIndex
CREATE INDEX "RecommendationRule_enabled_idx" ON "RecommendationRule"("enabled");

-- CreateIndex
CREATE INDEX "RecommendationResult_userId_idx" ON "RecommendationResult"("userId");

-- CreateIndex
CREATE INDEX "RecommendationResult_taskCategory_idx" ON "RecommendationResult"("taskCategory");

-- CreateIndex
CREATE INDEX "RecommendationResult_createdAt_idx" ON "RecommendationResult"("createdAt");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_recommendationId_idx" ON "RecommendationFeedback"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_userId_idx" ON "RecommendationFeedback"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ModelPricing_isVerified_idx" ON "ModelPricing"("isVerified");

-- CreateIndex
CREATE INDEX "ModelProfile_lifecycleStatus_idx" ON "ModelProfile"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "ModelProfile_verificationStatus_idx" ON "ModelProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "Tool_verificationStatus_idx" ON "Tool"("verificationStatus");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "IngestionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeEvent" ADD CONSTRAINT "ChangeEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceRegistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeEvent" ADD CONSTRAINT "ChangeEvent_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelDeprecation" ADD CONSTRAINT "ModelDeprecation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenchmarkResult" ADD CONSTRAINT "BenchmarkResult_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
