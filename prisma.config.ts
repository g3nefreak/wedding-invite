import { defineConfig } from 'prisma/config'

// The Prisma command line does not read .env on its own, so load it here.
// On a host like Vercel there is no .env file; the variables are already set.
try {
  process.loadEnvFile()
} catch {
  // No .env file: fine, as long as the variables come from somewhere else.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migrations need the direct connection, not the pooled one the app uses.
  // Left empty when unset so `prisma generate` still works without a database.
  datasource: { url: process.env.DIRECT_URL ?? '' },
})
