-- CreateEnum
CREATE TYPE "GrupoScout" AS ENUM ('SCOUTS', 'GUIAS');

-- AlterTable: add columns with temporary defaults to handle existing rows
ALTER TABLE "Rama" ADD COLUMN "edad_max" INTEGER,
ADD COLUMN "edad_min" INTEGER,
ADD COLUMN "grupo" "GrupoScout" NOT NULL DEFAULT 'SCOUTS',
ADD COLUMN "orden" INTEGER NOT NULL DEFAULT 0;

-- Remove the temporary defaults
ALTER TABLE "Rama" ALTER COLUMN "grupo" DROP DEFAULT;
ALTER TABLE "Rama" ALTER COLUMN "orden" DROP DEFAULT;

-- CreateTable
CREATE TABLE "UserRamaHistory" (
    "id" UUID NOT NULL,
    "id_user" UUID NOT NULL,
    "id_rama" UUID NOT NULL,
    "id_rama_anterior" UUID,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_egreso" TIMESTAMP(3),

    CONSTRAINT "UserRamaHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rama_grupo_orden_key" ON "Rama"("grupo", "orden");

-- AddForeignKey
ALTER TABLE "UserRamaHistory" ADD CONSTRAINT "UserRamaHistory_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRamaHistory" ADD CONSTRAINT "UserRamaHistory_id_rama_fkey" FOREIGN KEY ("id_rama") REFERENCES "Rama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRamaHistory" ADD CONSTRAINT "UserRamaHistory_id_rama_anterior_fkey" FOREIGN KEY ("id_rama_anterior") REFERENCES "Rama"("id") ON DELETE SET NULL ON UPDATE CASCADE;
