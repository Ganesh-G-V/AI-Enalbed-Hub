import { test, expect } from "@playwright/test";

test.describe("AI Enablement Hub E2E", () => {
  test("dashboard renders stat cards and quick actions", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle(/AI Enablement Hub/);

    await expect(page.getByText("Available tools", { exact: true })).toBeVisible();
    await expect(page.getByText("Published prompts", { exact: true })).toBeVisible();
    await expect(page.getByText("Evaluation runs", { exact: true })).toBeVisible();
    await expect(page.getByText("Recorded AI usage", { exact: true })).toBeVisible();

    await expect(page.locator("a").filter({ hasText: "Find an AI tool" }).first()).toBeVisible();
    await expect(page.locator("a").filter({ hasText: "Browse prompts" }).first()).toBeVisible();
    await expect(page.locator("a").filter({ hasText: "Cost lab" }).first()).toBeVisible();
    await expect(page.locator("a").filter({ hasText: "Knowledge Center" }).first()).toBeVisible();
  });

  test("home page renders feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").filter({ hasText: "AI Enablement Hub" })).toBeVisible();
    await expect(page.locator("a[href='/dashboard']").first()).toBeVisible();
    await expect(page.locator("a[href='/tools']").first()).toBeVisible();
    await expect(page.locator("a[href='/tools/recommend']").first()).toBeVisible();
    await expect(page.locator("a[href='/prompts']").first()).toBeVisible();
    await expect(page.locator("a[href='/knowledge']").first()).toBeVisible();
    await expect(page.locator("a[href='/token-lab']").first()).toBeVisible();
  });

  test("tools page lists tools", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator("h1").filter({ hasText: "AI Tool Finder" })).toBeVisible();
    await expect(page.getByText("6 tools matched")).toBeVisible();
  });

  test("recommendation wizard page renders", async ({ page }) => {
    await page.goto("/tools/recommend");
    await expect(page.locator("main h1").filter({ hasText: "AI Recommendation Wizard" })).toBeVisible();
    await expect(page.getByText("Task category")).toBeVisible();
  });

  test("prompts page lists prompts", async ({ page }) => {
    await page.goto("/prompts");
    await expect(page.locator("h1").filter({ hasText: "Prompt Library" })).toBeVisible();

    const countText = page.locator('text=/\\d+ prompt[s]? matched/');
    await expect(countText).toBeVisible();
    await expect(page.getByText("No prompts found")).not.toBeVisible();
  });

  test("knowledge page lists documents", async ({ page }) => {
    await page.goto("/knowledge");
    await expect(page.locator("h1").filter({ hasText: "Knowledge Center" })).toBeVisible();
  });

  test("token lab page renders", async ({ page }) => {
    await page.goto("/token-lab");
    await expect(page.locator("h1").filter({ hasText: "Token & Cost Lab" })).toBeVisible();
  });

  test("analytics page renders", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.locator("h1").filter({ hasText: "Analytics" })).toBeVisible();
  });

  test("evaluations page renders", async ({ page }) => {
    await page.goto("/evaluations");
    await expect(page.locator("h1").filter({ hasText: "Evaluation Lab" })).toBeVisible();
  });

  test("admin page renders", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h1").filter({ hasText: "Admin Settings" })).toBeVisible();
  });

  test("assistant page renders", async ({ page }) => {
    await page.goto("/assistant");
    await expect(page.locator("h1").filter({ hasText: "Knowledge Assistant" })).toBeVisible();
  });

  test("health and ready endpoints respond", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();

    const ready = await request.get("/api/ready");
    expect(ready.ok()).toBeTruthy();
  });
});
