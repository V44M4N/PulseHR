import { z } from 'zod';

const schema = z.object({
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  PORT:                   z.coerce.number().default(4000),
  DATABASE_URL:           z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL:              z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET:      z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FILE_STORAGE:           z.enum(['local', 's3']).default('local'),
  AWS_BUCKET:             z.string().optional(),
  AWS_REGION:             z.string().optional(),
  AWS_ACCESS_KEY_ID:      z.string().optional(),
  AWS_SECRET_ACCESS_KEY:  z.string().optional(),
  SMTP_HOST:              z.string().default('smtp.mailtrap.io'),
  SMTP_PORT:              z.coerce.number().default(2525),
  SMTP_USER:              z.string().default(''),
  SMTP_PASS:              z.string().default(''),
  SMTP_FROM:              z.string().default('noreply@pulsehr.io'),
  FRONTEND_URL:           z.string().default('http://localhost:8080'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  parsed.error.issues.forEach(i => console.error(`   ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
