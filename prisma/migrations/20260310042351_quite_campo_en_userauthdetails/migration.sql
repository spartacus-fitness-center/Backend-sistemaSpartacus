/*
  Warnings:

  - You are about to drop the column `reset_is_used` on the `user_auth_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_auth_details" DROP COLUMN "reset_is_used";
