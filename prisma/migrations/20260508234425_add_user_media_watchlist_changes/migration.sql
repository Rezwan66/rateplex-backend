/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SERIES', 'ANIME');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('RELEASED', 'ONGOING', 'UPCOMING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED');

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "country" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "episodes" INTEGER,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "seasons" INTEGER,
ADD COLUMN     "status" "MediaStatus" NOT NULL DEFAULT 'RELEASED',
ADD COLUMN     "trailerUrl" TEXT,
ADD COLUMN     "type" "MediaType" NOT NULL DEFAULT 'MOVIE',
ALTER COLUMN "streamingLink" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "watchlist" ADD COLUMN     "status" "WatchStatus" NOT NULL DEFAULT 'PLAN_TO_WATCH';

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
