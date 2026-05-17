import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UserLoginDTO } from './dto/user-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request as ExpressRequest } from 'express';
import { CreateUserDTO } from 'src/user/dto/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  async register(@Body() user: CreateUserDTO, @Request() req: ExpressRequest) {
    return this.authService.register(user, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Credenciales válidas — retorna token JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
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
  @ApiOperation({ summary: 'Obtener usuario autenticado desde el token' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async me(@Request() req: ExpressRequest) {
    return this.authService.me(req);
  }

  /**
   * POST /auth/forgot-password
   * Endpoint público — no requiere JWT.
   * Acepta un email y envía un enlace de recuperación si el usuario existe,
   * está activo y habilitado. Siempre responde de forma genérica para no revelar
   * si el email está registrado o no.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  @ApiResponse({
    status: 200,
    description:
      'Respuesta genérica (no revela si el email existe). Si el usuario es válido, se envía un email con el enlace.',
  })
  @ApiResponse({ status: 400, description: 'Email con formato inválido' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes — intenta más tarde' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'Si existe una cuenta asociada a ese email, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  /**
   * POST /auth/reset-password
   * Endpoint público — no requiere JWT.
   * Valida el token recibido por email, verifica la complejidad de la nueva
   * contraseña, la hashea con bcrypt e invalida el token.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Establecer nueva contraseña usando token de recuperación' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente' })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado o contraseña débil' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes — intenta más tarde' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Tu contraseña fue restablecida exitosamente.' };
  }

  /**
   * GET /auth/reset-password/validate?token=<valor>
   * Endpoint público — no requiere JWT.
   * Verifica si un token de recuperación es válido y no ha expirado.
   * Siempre responde HTTP 200 para no revelar información sobre tokens inexistentes.
   */
  @Get('reset-password/validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 900000 } })
  @ApiOperation({ summary: 'Validar token de recuperación de contraseña' })
  @ApiQuery({ name: 'token', required: true, description: 'Token de recuperación recibido por email' })
  @ApiResponse({
    status: 200,
    description: 'Retorna { valid: true } si el token existe y no expiró, { valid: false } en caso contrario',
    schema: { type: 'object', properties: { valid: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes — intenta más tarde' })
  async validateResetToken(@Query('token') token: string) {
    const valid = await this.authService.validateResetToken(token);
    return { valid };
  }
}
