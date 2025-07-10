import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class UserService {
    // constructor(private prisma: PrismaService) { };
    private prisma = new PrismaClient();

    async getAllUser() {
        return this.prisma.
    };
}
