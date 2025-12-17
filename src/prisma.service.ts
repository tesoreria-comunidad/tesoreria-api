import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL no está definida (revisá tu .env / ConfigModule)',
      );
    }

    const adapter = new PrismaPg({ connectionString: url });

    super({ adapter }); // 👈 Prisma 7 requiere opciones (adapter o accelerateUrl)
  }

  async onModuleInit() {
    await this.$connect();
  }
}
