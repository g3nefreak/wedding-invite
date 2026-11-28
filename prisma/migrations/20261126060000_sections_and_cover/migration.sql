-- AlterEnum
ALTER TYPE "AssetKind" ADD VALUE 'section';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cover" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sections" JSONB NOT NULL DEFAULT '[]';
