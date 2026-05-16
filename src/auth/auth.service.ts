import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ActionType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { IPayloadToken } from './schemas/auth.schemas';
import { CreateUserDTO } from 'src/user/dto/user.dto';
import { Request as ExpressRequest } from 'express';
import { EmailService } from './email/email.service';
import { ActionLogsService } from 'src/action-logs/action-logs.service';

/** Password complexity: min 8 chars, at least one uppercase, one lowercase, one digit */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Token TTL: 24 hours in milliseconds */
const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly actionLogsService: ActionLogsService,
  ) {}

  public async register(data: CreateUserDTO, req: ExpressRequest) {
    const { id } = await this.getDataFromToken(req);
    // minimal create via prisma to avoid circular dependency with user service
    const createData = {
      username: data.username,
      password: data.password,
      name: data.name,
      last_name: data.last_name,
      role: data.role,
      id_folder: data.id_folder ?? null,
      id_rama: data.id_rama ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      gender: data.gender ?? null,
      dni: data.dni ?? null,
      id_family: data.id_family ?? null,
      birthdate: data.birthdate ?? null,
      citizenship: data.citizenship ?? null,
      family_role: data.family_role ?? undefined,
    };
    const created = await this.prisma.user.create({ data: createData });
    return created;
  }
  public async validateUser(username: string, password: string) {
    const userByUsername = await this.prisma.user.findFirst({
      where: { username },
    });
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
    const user = await this.prisma.user.findUnique({
      where: { id: userData.id },
    });
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
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: process.env.JWTKEY,
      })) as IPayloadToken;
      if (!payload) {
        throw new NotFoundException('Tenant does not exist');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });
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
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: process.env.JWTKEY,
      })) as IPayloadToken;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });
      if (!user) {
        throw new NotFoundException('Tenant is not defined');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  /**
   * Generates a password-reset token and sends it via email.
   * Always returns a generic response to avoid user enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    // Lookup user by email — do NOT reveal whether it exists or not to the caller

    this.logger.log(`forgotPassword: solicitud recibida para email ${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate a cryptographically secure token (32 bytes = 64 hex chars)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      // Persist token (invalidates any previous pending token for this user)
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: rawToken,
          password_reset_token_expires_at: expiresAt,
        },
      });

      // Register ActionLog — token must NOT appear in logs
      // Wrapped in try/catch: a log failure must never break the generic response guarantee
      try {
        await this.actionLogsService.create(
          {
            action_type: ActionType.PASSWORD_RESET_REQUEST,
            target_table: 'USER',
            target_id: user.id,
            status: 'SUCCESS',
            message: 'Solicitud de recuperación de contraseña generada',
            metadata: { email_hint: email.replace(/(.{2}).+(@.+)/, '$1***$2') },
          },
          'SYSTEM',
        );
      } catch (logError) {
        this.logger.error(
          `forgotPassword: fallo el registro del ActionLog para usuario ${user.id}`,
          logError instanceof Error ? logError.stack : String(logError),
        );
      }

      // Send email — do this last so the log always fires even if email fails
      try {
        await this.emailService.sendPasswordResetEmail(email, rawToken, user.name);
      } catch (emailError) {
        this.logger.error(
          `forgotPassword: fallo el envío del email de recuperación para usuario ${user.id}`,
          emailError instanceof Error ? emailError.stack : String(emailError),
        );
        // Do not rethrow: the token is already stored; the user can retry
      }
    } else {
      // User not found or inactive — log nothing (avoid timing side-channel leaks)
      this.logger.log(`user details: ${JSON.stringify(user)}`);
      this.logger.log(
        `forgotPassword: solicitud para email sin usuario activo/habilitado (email ocultado)`,
      );
    }
    // Generic return — always the same, regardless of whether user exists
  }

  /**
   * Checks whether a password-reset token exists in DB and has not expired.
   * Never throws — always returns a boolean so the controller can respond
   * with HTTP 200 regardless of the outcome (no token enumeration).
   */
  async validateResetToken(token: string): Promise<boolean> {
    if (!token) return false;

    const user = await this.prisma.user.findUnique({
      where: { password_reset_token: token },
      select: { id: true, password_reset_token_expires_at: true },
    });

    if (!user || !user.password_reset_token_expires_at) return false;

    return user.password_reset_token_expires_at > new Date();
  }

  /**
   * Validates the reset token, enforces password complexity, hashes with bcrypt
   * and clears the token from the DB.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password complexity before hitting the DB
    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      );
    }

    // Find user by token
    const user = await this.prisma.user.findUnique({
      where: { password_reset_token: token },
    });

    if (!user || !user.password_reset_token_expires_at) {
      throw new BadRequestException(
        'El token de recuperación es inválido o ya fue utilizado',
      );
    }

    if (user.password_reset_token_expires_at < new Date()) {
      throw new BadRequestException('El token de recuperación ha expirado');
    }

    // Hash new password using bcrypt (same salt rounds as registration)
    const saltRounds = Number(process.env.HASH_SALT ?? 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear the token atomically
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_token_expires_at: null,
      },
    });

    // Register ActionLog — password update already committed; log failure must not undo it
    try {
      await this.actionLogsService.create(
        {
          action_type: ActionType.PASSWORD_RESET_SUCCESS,
          target_table: 'USER',
          target_id: user.id,
          status: 'SUCCESS',
          message: 'Contraseña restablecida exitosamente',
        },
        'SYSTEM',
      );
    } catch (logError) {
      this.logger.error(
        `resetPassword: fallo el registro del ActionLog para usuario ${user.id}`,
        logError instanceof Error ? logError.stack : String(logError),
      );
    }

    this.logger.log(
      `resetPassword: contraseña restablecida para usuario ${user.id}`,
    );
  }
}
