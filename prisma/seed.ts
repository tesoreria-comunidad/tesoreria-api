import 'dotenv/config';
import { PrismaClient, GrupoScout } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not defined in .env');
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const RAMAS = [
  { grupo: GrupoScout.SCOUTS, orden: 1, name: 'Manada',     edad_min: 6,  edad_max: 9  },
  { grupo: GrupoScout.SCOUTS, orden: 2, name: 'Unidad',     edad_min: 10, edad_max: 14 },
  { grupo: GrupoScout.SCOUTS, orden: 3, name: 'Caminantes', edad_min: 15, edad_max: 17 },
  { grupo: GrupoScout.SCOUTS, orden: 4, name: 'Rovers',     edad_min: 18, edad_max: 21 },
  { grupo: GrupoScout.GUIAS,  orden: 1, name: 'Alitas',     edad_min: 6,  edad_max: 9  },
  { grupo: GrupoScout.GUIAS,  orden: 2, name: 'Caravana',   edad_min: 10, edad_max: 14 },
  { grupo: GrupoScout.GUIAS,  orden: 3, name: 'Solar',      edad_min: 15, edad_max: 17 },
  { grupo: GrupoScout.GUIAS,  orden: 4, name: 'Clan',       edad_min: 18, edad_max: 21 },
] as const;

async function main() {
  console.log('Seeding ramas...');
  for (const rama of RAMAS) {
    await prisma.rama.upsert({
      where: { grupo_orden: { grupo: rama.grupo, orden: rama.orden } },
      update: {
        name: rama.name,
        edad_min: rama.edad_min,
        edad_max: rama.edad_max,
      },
      create: {
        name: rama.name,
        grupo: rama.grupo,
        orden: rama.orden,
        edad_min: rama.edad_min,
        edad_max: rama.edad_max,
      },
    });
    console.log(`  Upserted: ${rama.grupo} / orden ${rama.orden} — ${rama.name}`);
  }
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
