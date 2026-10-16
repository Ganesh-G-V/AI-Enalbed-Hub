import { PrismaClient, TaskCategory, ApprovalStatus, DataClassification, FeedbackRating, EvaluationStatus, UsageDataType } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding AI Enablement Hub...");

  // --- Users (demo) ---
  const demoUser = await db.user.upsert({
    where: { email: "developer@example.ai-hub.demo" },
    update: {},
    create: {
      email: "developer@example.ai-hub.demo",
      name: "Alex Developer",
      role: "MEMBER",
      isDemoUser: true,
    },
  });

  const adminUser = await db.user.upsert({
    where: { email: "admin@example.ai-hub.demo" },
    update: {},
    create: {
      email: "admin@example.ai-hub.demo",
      name: "Sam Admin",
      role: "ADMIN",
      isDemoUser: true,
    },
  });

  // --- Tools (catalogue) ---
  const tools: any[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
    {
      name: "GitHub Copilot",
      provider: "GitHub / Microsoft",
      category: "CODING",
      capabilities: ["Code generation", "Autocomplete", "Inline chat", "Test generation"],
      supportedTasks: ["coding", "debugging", "unit_testing"],
      approvalStatus: "APPROVED",
      dataHandling: "Code snippets may be sent to the provider. Avoid pasting secrets or customer data.",
      docsUrl: "https://docs.github.com/en/copilot",
      limitations: "Not approved for Restricted or Confidential source code.",
      recommendedUseCases: ["Boilerplate generation", "Unit test scaffolding", "Language translation"],
      lastReviewedAt: new Date("2026-02-01"),
    },
    {
      name: "Sourcegraph Cody",
      provider: "Sourcegraph",
      category: "CODING",
      capabilities: ["Code search", "Repository-aware chat", "Code explanation", "Refactoring"],
      supportedTasks: ["coding", "code_review", "architecture"],
      approvalStatus: "APPROVED",
      dataHandling: "Repository context is indexed locally; only matched snippets go to the provider.",
      docsUrl: "https://docs.sourcegraph.com/cody",
      limitations: "Requires repository indexing; large monorepos may have latency.",
      recommendedUseCases: ["Onboarding to a new codebase", "Code review assistance"],
      lastReviewedAt: new Date("2026-02-10"),
    },
    {
      name: "Cursor",
      provider: "Cursor",
      category: "CODING",
      capabilities: ["AI code generation", "Composer", "Inline edit", "Terminal commands"],
      supportedTasks: ["coding", "debugging", "documentation"],
      approvalStatus: "PENDING",
      dataHandling: "Code may be sent to the provider for completions.",
      docsUrl: "https://cursor.sh/docs",
      limitations: "Approval pending for Confidential data.",
      recommendedUseCases: ["Rapid prototyping", "Multi-file edits"],
      lastReviewedAt: new Date("2026-03-01"),
    },
    {
      name: "SQL Assistant",
      provider: "Internal Data Team",
      category: "SQL",
      capabilities: ["SQL generation", "Query explanation", "Schema browsing"],
      supportedTasks: ["sql", "data_analysis"],
      approvalStatus: "APPROVED",
      dataHandling: "Only schema metadata and query text are sent; no row data.",
      docsUrl: "https://internal.example.ai-hub.demo/sql-assistant",
      limitations: "Read-only; cannot execute writes.",
      recommendedUseCases: ["Ad-hoc reporting", "Query optimization"],
      lastReviewedAt: new Date("2026-01-20"),
    },
    {
      name: "Research Pilot",
      provider: "Internal AI Team",
      category: "RESEARCH",
      capabilities: ["Summarization", "Knowledge retrieval", "Citation"],
      supportedTasks: ["research", "summarization", "knowledge_retrieval"],
      approvalStatus: "APPROVED",
      dataHandling: "Approved for Public and Internal data only.",
      docsUrl: "https://internal.example.ai-hub.demo/research-pilot",
      limitations: "Not for Confidential or Restricted documents.",
      recommendedUseCases: ["Literature review", "Incident summarization"],
      lastReviewedAt: new Date("2026-02-15"),
    },
    {
      name: "Support Draft",
      provider: "Support Ops",
      category: "CUSTOMER_SUPPORT",
      capabilities: ["Response drafting", "Ticket categorization", "Knowledge-base lookup"],
      supportedTasks: ["customer_support", "summarization"],
      approvalStatus: "APPROVED",
      dataHandling: "Ticket content may be processed; redact PII before submission.",
      docsUrl: "https://internal.example.ai-hub.demo/support-draft",
      limitations: "Redact PII and secrets before use.",
      recommendedUseCases: ["Drafting customer replies", "Ticket triage"],
      lastReviewedAt: new Date("2026-03-05"),
    },
  ];

  const createdTools = [];
  for (const t of tools) {
    const existing = await db.tool.findFirst({ where: { name: t.name } });
    createdTools.push(
      existing
        ? await db.tool.update({ where: { id: existing.id }, data: t })
        : await db.tool.create({ data: t })
    );
  }

  // --- Model profiles ---
  const models: any[] = [
    {
      name: "claude-3-5-sonnet",
      provider: "Anthropic",
      displayName: "Claude 3.5 Sonnet",
      contextWindow: 200000,
      maxOutputTokens: 8192,
      supportsCaching: true,
      isApproved: true,
    },
    {
      name: "gpt-4o",
      provider: "OpenAI",
      displayName: "GPT-4o",
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportsCaching: true,
      isApproved: true,
    },
    {
      name: "mock-model",
      provider: "Demo",
      displayName: "Mock Demo Model",
      contextWindow: 32000,
      maxOutputTokens: 4096,
      supportsCaching: false,
      isApproved: true,
    },
  ];

  const createdModels = [];
  for (const m of models) {
    const existing = await db.modelProfile.findFirst({ where: { name: m.name } });
    createdModels.push(
      existing
        ? await db.modelProfile.update({ where: { id: existing.id }, data: m })
        : await db.modelProfile.create({ data: m })
    );
  }

  // --- Model pricing (versioned, illustrative) ---
  const pricing = [
    {
      modelName: "claude-3-5-sonnet",
      version: 1,
      effectiveAt: new Date("2026-01-01"),
      inputRate: 3.0,
      outputRate: 15.0,
      cachedRate: 1.5,
      currency: "USD",
      source: "Anthropic pricing page (illustrative for demo)",
      assumptions: "Illustrative rates only; verify current pricing with the provider.",
    },
    {
      modelName: "gpt-4o",
      version: 1,
      effectiveAt: new Date("2026-01-01"),
      inputRate: 2.5,
      outputRate: 10.0,
      cachedRate: 1.25,
      currency: "USD",
      source: "OpenAI pricing page (illustrative for demo)",
      assumptions: "Illustrative rates only; verify current pricing with the provider.",
    },
    {
      modelName: "mock-model",
      version: 1,
      effectiveAt: new Date("2026-01-01"),
      inputRate: 0.0,
      outputRate: 0.0,
      cachedRate: null,
      currency: "USD",
      source: "AI Enablement Hub demo",
      assumptions: "Demo pricing is zero; not a real provider rate.",
    },
  ];

  for (const p of pricing) {
    const model = createdModels.find((m) => m.name === p.modelName);
    const existing = await db.modelPricing.findFirst({
      where: { modelId: model!.id, version: p.version },
    });
    if (existing) {
      await db.modelPricing.update({
        where: { id: existing.id },
        data: {
          effectiveAt: p.effectiveAt,
          inputRatePerMillion: p.inputRate,
          outputRatePerMillion: p.outputRate,
          cachedInputRatePerMillion: p.cachedRate,
          currency: p.currency,
          source: p.source,
          assumptions: p.assumptions,
          isIllustrative: true,
          isCurrent: true,
        },
      });
    } else {
      await db.modelPricing.create({
        data: {
          modelId: model!.id,
          version: p.version,
          effectiveAt: p.effectiveAt,
          inputRatePerMillion: p.inputRate,
          outputRatePerMillion: p.outputRate,
          cachedInputRatePerMillion: p.cachedRate,
          currency: p.currency,
          source: p.source,
          assumptions: p.assumptions,
          isIllustrative: true,
          isCurrent: true,
        },
      });
    }
  }

  // --- Prompt templates ---
  const prompts: any[] = [
    {
      title: "Generate unit tests for a function",
      category: "TESTING",
      description: "Write comprehensive unit tests for a given function with edge cases.",
      template: "Write unit tests for the following function using {{TEST_FRAMEWORK}}. Include test cases for happy paths, edge cases, and error handling.\n\nFunction:\n```{{LANGUAGE}}\n{{CODE}}\n```",
      inputPlaceholders: ["TEST_FRAMEWORK", "LANGUAGE", "CODE"],
      exampleInput: "TEST_FRAMEWORK=Jest, LANGUAGE=TypeScript, CODE=(a: number, b: number) => a + b",
      exampleOutput: "describe('add', () => { it('adds two positive numbers', () => { expect(add(1, 2)).toBe(3); }); });",
      instructions: "Paste the function you want tested and specify your test framework.",
      applicableRole: "developer",
      difficulty: "beginner",
      tags: ["unit-testing", "jest", "typescript"],
      isPublished: true,
    },
    {
      title: "Explain code",
      category: "DOCUMENTATION",
      description: "Explain what a block of code does in plain language.",
      template: "Explain the following code in plain language suitable for a {{AUDIENCE}}.\n\n```{{LANGUAGE}}\n{{CODE}}\n```",
      inputPlaceholders: ["AUDIENCE", "LANGUAGE", "CODE"],
      exampleInput: "AUDIENCE=junior developer, LANGUAGE=Python, CODE=def fib(n): ...",
      exampleOutput: "This function computes the nth Fibonacci number using recursion...",
      instructions: "Paste the code and specify your audience.",
      applicableRole: "developer",
      difficulty: "beginner",
      tags: ["code-explanation", "documentation"],
      isPublished: true,
    },
    {
      title: "Review a pull request",
      category: "CODE_REVIEW",
      description: "Check a diff for bugs, security issues, and maintainability.",
      template: "Review the following code diff for bugs, security issues, and maintainability. List issues with severity and suggested fixes.\n\n```diff\n{{DIFF}}\n```",
      inputPlaceholders: ["DIFF"],
      exampleInput: "diff --git a/src/index.ts b/src/index.ts",
      exampleOutput: "1. Potential SQL injection in line 12 (high) - use parameterized queries.",
      instructions: "Paste the full diff. Do not include secrets.",
      applicableRole: "developer",
      difficulty: "intermediate",
      tags: ["code-review", "security"],
      isPublished: true,
    },
    {
      title: "Write SQL from natural language",
      category: "SQL",
      description: "Convert a question into a SQL query against a known schema.",
      template: "Write a SQL query for the following question using the provided schema.\n\nQuestion: {{QUESTION}}\n\nSchema:\n{{SCHEMA}}\n\nRequirements: {{REQUIREMENTS}}",
      inputPlaceholders: ["QUESTION", "SCHEMA", "REQUIREMENTS"],
      exampleInput: "QUESTION=top 5 customers by spend, SCHEMA=customers(id, name), orders(id, customer_id, amount), REQUIREMENTS=order by total desc",
      exampleOutput: "SELECT c.name, SUM(o.amount) as total FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total DESC LIMIT 5;",
      instructions: "Provide the question, schema, and any requirements.",
      applicableRole: "data analyst",
      difficulty: "intermediate",
      tags: ["sql", "data-analysis"],
      isPublished: true,
    },
    {
      title: "Draft architecture decision record",
      category: "ARCHITECTURE",
      description: "Draft an Architecture Decision Record for a proposed technical decision.",
      template: "Draft an Architecture Decision Record for: {{TITLE}}\n\nContext: {{CONTEXT}}\nDecision: {{DECISION}}\nConsequences: {{CONSEQUENCES}}",
      inputPlaceholders: ["TITLE", "CONTEXT", "DECISION", "CONSEQUENCES"],
      exampleInput: "TITLE=Adopt AI coding assistant, CONTEXT=Team wants to speed up feature delivery, ...",
      exampleOutput: "# ADR-001 ...",
      instructions: "Fill in the decision context and outcome.",
      applicableRole: "architect",
      difficulty: "advanced",
      tags: ["architecture", "adr"],
      isPublished: true,
    },
  ];

  const createdPrompts = [];
  for (const p of prompts) {
    const existing = await db.promptTemplate.findFirst({ where: { title: p.title } });
    createdPrompts.push(
      existing
        ? await db.promptTemplate.update({ where: { id: existing.id }, data: p })
        : await db.promptTemplate.create({ data: p })
    );
  }

  // --- Knowledge documents ---
  const docs: any[] = [
    {
      title: "AI Usage Policy",
      category: "Policy",
      content: "Employees may use approved AI tools for coding, documentation, and analysis. Do not paste confidential customer data, secrets, or Restricted classification data into unapproved tools. All AI-generated code must be reviewed by a human before merge.",
      summary: "Company-wide policy for acceptable AI use.",
      sourceUrl: "https://internal.example.ai-hub.demo/policy/ai-usage",
      version: "1.0",
      reviewedAt: new Date("2026-02-01"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["policy", "governance"],
    },
    {
      title: "Secure use of AI with source code",
      category: "Security",
      content: "Never submit API keys, credentials, or customer PII to AI tools. Use only approved tools for internal source code. Review all AI-generated code for security vulnerabilities before merging.",
      summary: "Guidelines for using AI with source code.",
      sourceUrl: "https://internal.example.ai-hub.demo/security/ai-source-code",
      version: "1.1",
      reviewedAt: new Date("2026-02-10"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["security", "source-code"],
    },
    {
      title: "AI coding best practices",
      category: "Engineering",
      content: "Treat AI-generated code as a draft. Write tests first where possible. Verify all outputs. Do not blindly copy suggestions. Keep prompts focused and bounded.",
      summary: "Best practices for AI-assisted coding.",
      sourceUrl: "https://internal.example.ai-hub.demo/engineering/ai-coding-best-practices",
      version: "1.0",
      reviewedAt: new Date("2026-01-20"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["engineering", "best-practices"],
    },
    {
      title: "Prompt engineering guide",
      category: "Engineering",
      content: "Use clear instructions, provide examples, specify output format, and bound response length. Iterate based on results.",
      summary: "How to write effective prompts.",
      sourceUrl: "https://internal.example.ai-hub.demo/engineering/prompt-engineering-guide",
      version: "1.0",
      reviewedAt: new Date("2026-01-25"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["prompt-engineering"],
    },
    {
      title: "Token optimization handbook",
      category: "Engineering",
      content: "Remove irrelevant context, avoid repeating instructions, use structured output only when needed, limit output length, and reuse stable context with provider caching.",
      summary: "Reducing token usage and cost.",
      sourceUrl: "https://internal.example.ai-hub.demo/engineering/token-optimization",
      version: "1.0",
      reviewedAt: new Date("2026-02-05"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["token-optimization", "cost"],
    },
    {
      title: "AI-assisted testing guide",
      category: "Quality",
      content: "Use AI to generate unit tests, but validate them. AI can miss edge cases. Always run generated tests and review assertions.",
      summary: "Using AI for testing.",
      sourceUrl: "https://internal.example.ai-hub.demo/quality/ai-testing",
      version: "1.0",
      reviewedAt: new Date("2026-02-12"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["testing", "quality"],
    },
    {
      title: "AI-generated code review checklist",
      category: "Quality",
      content: "Check for security issues, correctness, maintainability, and test coverage. Verify no secrets are committed.",
      summary: "Checklist for reviewing AI-generated code.",
      sourceUrl: "https://internal.example.ai-hub.demo/quality/code-review-checklist",
      version: "1.0",
      reviewedAt: new Date("2026-02-14"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["code-review", "checklist"],
    },
    {
      title: "Data privacy and confidentiality guide",
      category: "Security",
      content: "Classify data before sending to AI. Public and Internal data may go to approved tools. Confidential and Restricted data require explicit approval.",
      summary: "Data classification for AI use.",
      sourceUrl: "https://internal.example.ai-hub.demo/security/data-privacy",
      version: "1.1",
      reviewedAt: new Date("2026-03-01"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["privacy", "confidentiality"],
    },
    {
      title: "AI hallucination and verification guide",
      category: "Engineering",
      content: "AI can produce plausible but incorrect outputs. Always verify against authoritative sources. Treat AI output as unverified.",
      summary: "Recognizing and verifying AI hallucinations.",
      sourceUrl: "https://internal.example.ai-hub.demo/engineering/hallucination-guide",
      version: "1.0",
      reviewedAt: new Date("2026-02-20"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["hallucination", "verification"],
    },
    {
      title: "Approved AI tools catalogue",
      category: "Catalogue",
      content: "See the AI Tool Finder for the current list of approved tools, their approval status, and data handling guidance.",
      summary: "Catalogue of approved AI tools.",
      sourceUrl: "https://internal.example.ai-hub.demo/catalogue/approved-tools",
      version: "1.0",
      reviewedAt: new Date("2026-03-05"),
      isSample: true,
      roleAccess: ["member", "admin", "viewer"],
      tags: ["catalogue", "approved-tools"],
    },
  ];

  for (const d of docs) {
    const existing = await db.knowledgeDocument.findFirst({ where: { title: d.title } });
    if (existing) {
      await db.knowledgeDocument.update({ where: { id: existing.id }, data: { ...d, isPublished: true } });
    } else {
      await db.knowledgeDocument.create({ data: { ...d, isPublished: true } });
    }
  }

  // --- Evaluation scenarios ---
  const scenarios: any[] = [
    { title: "Code explanation", category: "DOCUMENTATION", description: "Explain a code snippet in plain language.", rubric: "Correctness and clarity of explanation.", input: "Explain this function", expectedOutcome: "Plain-language explanation", isAutomated: false },
    { title: "Unit test generation", category: "TESTING", description: "Generate unit tests for a function.", rubric: "Tests cover happy path and edge cases.", input: "Generate unit tests", expectedOutcome: "Passing test suite", isAutomated: false },
    { title: "Debugging", category: "DEBUGGING", description: "Diagnose and fix a bug.", rubric: "Root cause identified and fix is correct.", input: "Fix this bug", expectedOutcome: "Corrected code", isAutomated: false },
    { title: "SQL assistance", category: "SQL", description: "Write SQL from natural language.", rubric: "Query returns expected results and is safe.", input: "Write a query", expectedOutcome: "Valid SQL", isAutomated: true },
    { title: "Documentation", category: "DOCUMENTATION", description: "Document a code module.", rubric: "README is accurate and complete.", input: "Document this module", expectedOutcome: "README section", isAutomated: false },
    { title: "Summarization", category: "SUMMARIZATION", description: "Summarize an article.", rubric: "Summary captures key points accurately.", input: "Summarize this article", expectedOutcome: "Concise summary", isAutomated: false },
    { title: "Tool recommendation", category: "KNOWLEDGE_RETRIEVAL", description: "Recommend an approved AI tool.", rubric: "Recommendation is approved for the data class.", input: "Recommend a tool", expectedOutcome: "Approved tool", isAutomated: false },
    { title: "Knowledge Q&A", category: "RESEARCH", description: "Answer a question from policy docs.", rubric: "Answer cites the relevant policy.", input: "Answer from policy", expectedOutcome: "Cited answer", isAutomated: false },
  ];

  for (const s of scenarios) {
    const existing = await db.evaluationScenario.findFirst({ where: { title: s.title } });
    if (existing) {
      await db.evaluationScenario.update({ where: { id: existing.id }, data: { ...s, isSample: true } });
    } else {
      await db.evaluationScenario.create({ data: { ...s, isSample: true } });
    }
  }

  // --- Usage events (seeded demo data) ---
  const demoTool = createdTools[0];
  const demoModel = createdModels[2];
  for (let i = 0; i < 40; i++) {
    await db.usageEvent.create({
      data: {
        userId: demoUser.id,
        toolId: demoTool.id,
        modelId: demoModel.id,
        category: "CODING",
        dataClassification: "INTERNAL",
        inputTokens: 250 + i * 10,
        outputTokens: 120 + i * 5,
        cachedTokens: i % 3 === 0 ? 100 : 0,
        estimatedCost: 0.0012 + i * 0.0001,
        currency: "USD",
        dataType: "SEEDED",
        latencyMs: 400 + i * 10,
        provider: "Demo",
        requestId: `seeded-${i}`,
        success: true,
      },
    });
  }

  // --- Feedback (seeded) ---
  for (let i = 0; i < 12; i++) {
    await db.feedback.create({
      data: {
        userId: demoUser.id,
        targetType: "prompt",
        targetId: createdPrompts[i % createdPrompts.length].id,
        rating: i % 3 === 0 ? "NOT_HELPFUL" : "HELPFUL",
        comment: i % 4 === 0 ? "Helpful starting point." : null,
      },
    });
  }

  // --- App settings ---
  await db.appSetting.upsert({
    where: { key: "demo_mode" },
    update: { value: "true" },
    create: { key: "demo_mode", value: "true", description: "Enable demo mode with seeded data" },
  });
  await db.appSetting.upsert({
    where: { key: "usage_limit_per_user" },
    update: { value: "1000" },
    create: { key: "usage_limit_per_user", value: "1000", description: "Monthly usage limit per user" },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
