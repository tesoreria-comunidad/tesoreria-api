import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';
import { RequestWithUser, extractLoggedUser } from 'src/auth/request.util';
import { LoggedUser } from 'src/auth/types';

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

      const decoded = await this.authServices.getDataFromToken(req);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      // Map/ensure decoded matches LoggedUser shape. authService.getDataFromToken
      // should ideally return this shape already; map defensively here.
      const logged: LoggedUser = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        id_rama: decoded.id_rama ?? null,
        id_family: decoded.id_family ?? null,
        is_granted: decoded.is_granted ?? false,
        is_active: decoded.is_active ?? false
      };

      req.user = logged;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
