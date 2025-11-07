import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDTO } from './dto/user-login.dto';
import { Request as ExpressRequest } from 'express';
import { CreateUserDTO } from 'src/user/dto/user.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: CreateUserDTO, @Request() req: ExpressRequest) {
    return this.authService.register(user, req);
  }
  @Post('login')
  async login(@Body() { username, password }: UserLoginDTO) {
    const userValidate = await this.authService.validateUser(
      username,
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
