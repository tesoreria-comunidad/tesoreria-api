import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: User) {
    return this.authService.register(user);
  }
  @Post('login')
  async login(
    @Body() { userName, password }: { userName: string; password: string },
  ) {
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
}
