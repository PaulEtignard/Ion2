import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` n'a pas besoin de base : on tolère l'absence de DATABASE_URL (ex. postinstall sur Vercel).
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
