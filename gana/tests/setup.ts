// Ensure DATABASE_URL is available for Prisma in tests.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://ganeshgv@localhost:5433/ai_hub";
}
