-- Migration: add_password_reset_fields
-- Adds password reset token fields to the User model
-- and new ActionType enum values for password reset audit trail

-- Add password reset token fields to User
ALTER TABLE "User" ADD COLUMN "password_reset_token" TEXT;
ALTER TABLE "User" ADD COLUMN "password_reset_token_expires_at" TIMESTAMP(3);

-- Unique constraint on the reset token
ALTER TABLE "User" ADD CONSTRAINT "User_password_reset_token_key" UNIQUE ("password_reset_token");

-- Add new ActionType enum values
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_REQUEST';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET_SUCCESS';
