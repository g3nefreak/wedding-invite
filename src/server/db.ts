import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '#/generated/prisma/client'

// In development Next.js reloads code often. Keeping the client on globalThis
// reuses one set of database connections instead of opening more each reload.
const store = globalThis as typeof globalThis & { __prisma?: PrismaClient }

// Created on first use, so code that never touches the database (tests,
// the build) does not need the connection string.
export function db(): PrismaClient {
  if (!store.__prisma) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    store.__prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    })
  }
  return store.__prisma
}
