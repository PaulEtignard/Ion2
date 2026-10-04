-- CreateEnum
CREATE TYPE "ClassId" AS ENUM ('gladiator', 'templar', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter');

-- CreateEnum
CREATE TYPE "Faction" AS ENUM ('ELYOS', 'ASMODIAN');

-- CreateEnum
CREATE TYPE "BuildMode" AS ENUM ('PVE', 'PVP', 'HYBRID');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" "ClassId" NOT NULL,
    "faction" "Faction" NOT NULL DEFAULT 'ELYOS',
    "server" TEXT,
    "color" TEXT NOT NULL DEFAULT '#38bdf8',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProgress" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "itemLevel" INTEGER NOT NULL DEFAULT 0,
    "combatPower" INTEGER NOT NULL DEFAULT 0,
    "ascensionStep" INTEGER NOT NULL DEFAULT 0,
    "buildId" TEXT,
    "daevanion" JSONB NOT NULL DEFAULT '{}',
    "transcendence" JSONB NOT NULL DEFAULT '{}',
    "nightmare" JSONB NOT NULL DEFAULT '{}',
    "gear" JSONB NOT NULL DEFAULT '{}',
    "skillLevels" JSONB NOT NULL DEFAULT '{}',
    "stigmas" JSONB NOT NULL DEFAULT '{}',
    "clears" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressSnapshot" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "itemLevel" INTEGER NOT NULL,
    "combatPower" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "activityKey" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classId" "ClassId" NOT NULL,
    "mode" "BuildMode" NOT NULL DEFAULT 'PVE',
    "role" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author" TEXT NOT NULL DEFAULT 'Claude',
    "patch" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProgress_playerId_key" ON "PlayerProgress"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressSnapshot_playerId_day_key" ON "ProgressSnapshot"("playerId", "day");

-- CreateIndex
CREATE INDEX "ActivityLog_periodKey_idx" ON "ActivityLog"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_playerId_activityKey_periodKey_key" ON "ActivityLog"("playerId", "activityKey", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "Build_slug_key" ON "Build"("slug");

-- CreateIndex
CREATE INDEX "Build_classId_idx" ON "Build"("classId");

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressSnapshot" ADD CONSTRAINT "ProgressSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
