import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "node:path";

// Load environment variables
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "./prisma/schema",
  migrations: {
    seed: `bun run prisma/seed.ts`,
  },
});