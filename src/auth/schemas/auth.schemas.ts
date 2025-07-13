import { UserSchema } from 'src/user/schema/user.schema';
import { z } from 'zod';

export const AuthBodySchema = z.object({
  user: z.string(),
  password: z.string(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});

export const UseTokenSchema = z.object({
  role: z.string(),
  sub: z.string(),
  isExpired: z.boolean(),
});

export type IPayloadToken = z.infer<typeof UserSchema>;
export type IAuthBody = z.infer<typeof AuthBodySchema>;
export type IAuthResponse = z.infer<typeof AuthResponseSchema>;
export type IUseToken = z.infer<typeof UseTokenSchema>;
