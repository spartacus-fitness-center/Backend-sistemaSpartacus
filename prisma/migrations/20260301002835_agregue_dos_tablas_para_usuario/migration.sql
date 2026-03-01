-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_is_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "member_profiles" (
    "user_id" TEXT NOT NULL,
    "coach_id" TEXT,
    "member_number" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "goal" TEXT,
    "birthdate" TIMESTAMP(3),
    "streak" INTEGER NOT NULL DEFAULT 0,
    "is_profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_auth_details" (
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "refresh_expires_at" TIMESTAMP(3),
    "reset_token_hash" TEXT,
    "reset_expires_at" TIMESTAMP(3),
    "reset_is_used" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token_hash" TEXT,
    "email_verify_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_auth_details_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_auth_details" ADD CONSTRAINT "user_auth_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
