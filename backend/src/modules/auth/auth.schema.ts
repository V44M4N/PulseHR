import { z } from 'zod';

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  mfaCode:  z.string().regex(/^\d{6}$/).optional(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type LoginDTO   = z.infer<typeof LoginSchema>;
export type RefreshDTO = { refreshToken: string };

export const MfaCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
