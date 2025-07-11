import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';
import { IAuthResponse } from './schemas/auth.schemas';
@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  public async register(user: User) {
    const hashPassword = await bcrypt.hash(user.password, 10);
    const data: User = {
      ...user,
      password: hashPassword,
    };
    return await this.userService.create(data);
  }
  public async validateUser(userName: string, password: string) {
    const userByUsername = await this.userService.findBy({
      key: 'userName',
      value: userName,
    });
    const userByEmail = await this.userService.findBy({
      key: 'email',
      value: userName,
    });

    if (userByUsername) {
      const match = await bcrypt.compare(password, userByUsername.password);
      if (match) return userByUsername;
    }

    if (userByEmail) {
      const match = await bcrypt.compare(password, userByEmail.password);
      if (match) return userByEmail;
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
    const user = await this.userService.getById(userData.id);
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
}
