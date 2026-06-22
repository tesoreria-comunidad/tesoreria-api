-- Fix: UserRamaHistory_id_user_fkey was created with RESTRICT but schema defines CASCADE
ALTER TABLE "UserRamaHistory" DROP CONSTRAINT "UserRamaHistory_id_user_fkey";

ALTER TABLE "UserRamaHistory" ADD CONSTRAINT "UserRamaHistory_id_user_fkey"
  FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
