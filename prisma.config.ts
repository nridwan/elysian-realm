import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  migrations: {
    seed: `bun run prisma/seed.ts`,
  },
});