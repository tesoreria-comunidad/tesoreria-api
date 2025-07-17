import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';
import { UserRegisterDTO } from './dto/user-register.dto';
import { UserLoginDTO } from './dto/user-login.dto';
import { Request as ExpressRequest } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: User) {
    return this.authService.register(user as User);
  }
  @Post('login')
  async login(@Body() { userName, password }: UserLoginDTO) {
    const userValidate = await this.authService.validateUser(
      userName,
      password,
    );

    if (!userValidate) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jwt = await this.authService.generateJWT(userValidate);

    return {
      user: jwt.user,
      backendTokens: {
        accessToken: jwt.accessToken,
      },
    };
  }
  @Post('me')
  async me(@Request() req: ExpressRequest) {
    return this.authService.me(req);
  }
}
