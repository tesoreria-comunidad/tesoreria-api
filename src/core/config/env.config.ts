import { z } from 'zod';

const envZodModel = z
  .object({
    DATABASE_URL: z.string().url(),
    PROD_DB: z.string().url(),
    PORT: z.string(),
    JWTKEY: z.string(),
    HASH_SALT: z.string(),
    AWS_REGION: z.string(),
    AWS_BUCKET_NAME: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
  })
  .refine((data) => data.DATABASE_URL !== data.PROD_DB, {
    message: '❌ DATABASE_URL y PROD_DB no pueden ser iguales',
    path: ['DATABASE_URL'], // Podés poner ambos, pero uno alcanza para marcar el error
  });
if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
  const parsed = envZodModel.safeParse(process.env);

  if (!parsed.success) {
    console.error('Error en variables de entorno:');
    console.error(
      parsed.error.errors.map((err) => ` - ${err.message}`).join('\n'),
    );
    process.exit(1);
  }
}

type EnvType = z.infer<typeof envZodModel>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {}
  }
}
