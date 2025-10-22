/*
  Warnings:

  - You are about to drop the `AuditTrail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AuditTrail" DROP CONSTRAINT "AuditTrail_user_id_fkey";

-- DropTable
DROP TABLE "public"."AuditTrail";

-- CreateTable
CREATE TABLE "public"."audit_trails" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_rolled_back" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."audit_trails" ADD CONSTRAINT "audit_trails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
