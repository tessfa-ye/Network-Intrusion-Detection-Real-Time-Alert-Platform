import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx ts-node src/seed.ts",
  },
  datasource: {
    // Use process.env directly so prisma generate works during Docker build
    // without requiring DATABASE_URL. The real URL is injected at runtime.
    url: process.env.DATABASE_URL || "postgresql://build:build@localhost:5432/build",
  },
});
