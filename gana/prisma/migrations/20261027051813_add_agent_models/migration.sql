-- CreateTable
CREATE TABLE "AgentProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "docsUrl" TEXT,
    "sourceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "lastVerifiedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentCapability" (
    "id" TEXT NOT NULL,
    "agentProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportedTasks" TEXT[],
    "multiFileEdit" BOOLEAN NOT NULL DEFAULT false,
    "terminalAccess" BOOLEAN NOT NULL DEFAULT false,
    "testExecution" BOOLEAN NOT NULL DEFAULT false,
    "prWorkflow" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "lastVerifiedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCapability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentProduct_provider_idx" ON "AgentProduct"("provider");

-- CreateIndex
CREATE INDEX "AgentProduct_approvalStatus_idx" ON "AgentProduct"("approvalStatus");

-- CreateIndex
CREATE INDEX "AgentCapability_agentProductId_idx" ON "AgentCapability"("agentProductId");

-- AddForeignKey
ALTER TABLE "AgentCapability" ADD CONSTRAINT "AgentCapability_agentProductId_fkey" FOREIGN KEY ("agentProductId") REFERENCES "AgentProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
