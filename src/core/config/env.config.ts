import { z } from 'zod';

const envZodModel = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string(),
  JWTKEY: z.string(),
  HASH_SALT: z.string(),
});

envZodModel.parse(process.env);

type EnvType = z.infer<typeof envZodModel>;
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {}
  }
}
