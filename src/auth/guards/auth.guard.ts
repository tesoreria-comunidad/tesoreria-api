import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly reflector: Reflector,
    private readonly authServices: AuthService,
  ) {}
  async canActivate(context: ExecutionContext) {
    try {
      const req = context.switchToHttp().getRequest<RequestWithUser>();

      const token = await this.authServices.getDataFromToken(req);
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }
      
      req.user = token;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
