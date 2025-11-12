import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { IPayloadToken } from './schemas/auth.schemas';
import { CreateUserDTO } from 'src/user/dto/user.dto';
import { Request as ExpressRequest } from 'express';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async register(data: CreateUserDTO, req: ExpressRequest) {
    const { id } = await this.getDataFromToken(req);
    // minimal create via prisma to avoid circular dependency with user service
    const created = await this.prisma.user.create({ data: { ...data } as any });
    return created;
  }
  public async validateUser(username: string, password: string) {
    const userByUsername = await this.prisma.user.findFirst({ where: { username } });
    if (userByUsername) {
      const match = await bcrypt.compare(password, userByUsername.password);
      if (match) return userByUsername;
    }
    return null;
  }
  public signJWT({
    payload,
    secret,
  }: {
    payload: jwt.JwtPayload;
    secret: string;
  }): string {
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }
  public async generateJWT(userData: User) {
    const user = await this.prisma.user.findUnique({ where: { id: userData.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload: Partial<User> = {
      ...user,
      password: '',
    };

    return {
      accessToken: this.signJWT({
        payload,
        secret: process.env.JWTKEY,
      }),
      user: payload,
    };
  }
  public async me(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWTKEY,
      });
      if (!payload) {
        throw new NotFoundException('Tenant does not exist');
      }
  const user = await this.prisma.user.findUnique({ where: { id: (payload as any).id } });
      if (!user) throw new NotFoundException('User does not exist');
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token expired or invalid');
    }
  }
  async getDataFromToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (!token) throw new UnauthorizedException('Invalid token');
    try {
      const payload: IPayloadToken = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWTKEY,
      });

      const user = await this.prisma.user.findUnique({ where: { id: (payload as any).id } });
      if (!user) {
        throw new NotFoundException('Tenant is not defined');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
