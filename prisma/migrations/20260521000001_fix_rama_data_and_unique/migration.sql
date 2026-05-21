-- Idempotent migration: add GrupoScout enum, alter Rama, create UserRamaHistory

-- Step 1: Create GrupoScout enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrupoScout') THEN
    CREATE TYPE "GrupoScout" AS ENUM ('SCOUTS', 'GUIAS');
  END IF;
END $$;

-- Step 2: Add columns to Rama if they don't already exist (with temporary defaults)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Rama' AND column_name = 'grupo'
  ) THEN
    ALTER TABLE "Rama" ADD COLUMN "grupo" "GrupoScout" NOT NULL DEFAULT 'SCOUTS';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Rama' AND column_name = 'orden'
  ) THEN
    ALTER TABLE "Rama" ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Rama' AND column_name = 'edad_min'
  ) THEN
    ALTER TABLE "Rama" ADD COLUMN "edad_min" INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Rama' AND column_name = 'edad_max'
  ) THEN
    ALTER TABLE "Rama" ADD COLUMN "edad_max" INTEGER;
  END IF;
END $$;

-- Step 3: Assign correct grupo+orden based on known legacy names
UPDATE "Rama" SET "grupo" = 'SCOUTS'::"GrupoScout", "orden" = 1 WHERE "name" = 'Manada';
UPDATE "Rama" SET "grupo" = 'SCOUTS'::"GrupoScout", "orden" = 2 WHERE "name" = 'Unidad';
UPDATE "Rama" SET "grupo" = 'SCOUTS'::"GrupoScout", "orden" = 3 WHERE "name" = 'Caminantes';
UPDATE "Rama" SET "grupo" = 'SCOUTS'::"GrupoScout", "orden" = 4 WHERE "name" = 'Rovers';
UPDATE "Rama" SET "grupo" = 'GUIAS'::"GrupoScout",  "orden" = 1 WHERE "name" = 'Alitas';
UPDATE "Rama" SET "grupo" = 'GUIAS'::"GrupoScout",  "orden" = 2 WHERE "name" = 'Caravana';
UPDATE "Rama" SET "grupo" = 'GUIAS'::"GrupoScout",  "orden" = 3 WHERE "name" = 'Solar';
UPDATE "Rama" SET "grupo" = 'GUIAS'::"GrupoScout",  "orden" = 4 WHERE "name" = 'Clan';

-- Step 4: Assign negative order to any remaining rows with orden = 0 (unknown legacy rows)
DO $$
DECLARE
  r RECORD;
  counter INTEGER := -1;
BEGIN
  FOR r IN SELECT id FROM "Rama" WHERE "orden" = 0 ORDER BY "createdAt" LOOP
    UPDATE "Rama" SET "orden" = counter WHERE "id" = r.id;
    counter := counter - 1;
  END LOOP;
END $$;

-- Step 5: Drop the temporary defaults
ALTER TABLE "Rama" ALTER COLUMN "grupo" DROP DEFAULT;
ALTER TABLE "Rama" ALTER COLUMN "orden" DROP DEFAULT;

-- Step 6: Create the unique index if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'Rama' AND indexname = 'Rama_grupo_orden_key'
  ) THEN
    CREATE UNIQUE INDEX "Rama_grupo_orden_key" ON "Rama"("grupo", "orden");
  END IF;
END $$;

-- Step 7: Create UserRamaHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "UserRamaHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_user" UUID NOT NULL,
    "id_rama" UUID NOT NULL,
    "id_rama_anterior" UUID,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_egreso" TIMESTAMP(3),

    CONSTRAINT "UserRamaHistory_pkey" PRIMARY KEY ("id")
);

-- Step 8: Add foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRamaHistory_id_user_fkey'
  ) THEN
    ALTER TABLE "UserRamaHistory"
      ADD CONSTRAINT "UserRamaHistory_id_user_fkey"
      FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRamaHistory_id_rama_fkey'
  ) THEN
    ALTER TABLE "UserRamaHistory"
      ADD CONSTRAINT "UserRamaHistory_id_rama_fkey"
      FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRamaHistory_id_rama_anterior_fkey'
  ) THEN
    ALTER TABLE "UserRamaHistory"
      ADD CONSTRAINT "UserRamaHistory_id_rama_anterior_fkey"
      FOREIGN KEY ("id_rama_anterior") REFERENCES "Rama"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
