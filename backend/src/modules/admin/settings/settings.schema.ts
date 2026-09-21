import { z } from 'zod';

// ── Update a single setting value ─────────────────────────────────────────────

export const UpdateSettingSchema = z.object({
  value: z.any(),
});

export type UpdateSettingDTO = z.infer<typeof UpdateSettingSchema>;

// ── Filter settings by category (query param) ────────────────────────────────

export const GetSettingsByCategorySchema = z.object({
  category: z.string().min(1, 'category is required'),
});

export type GetSettingsByCategoryDTO = z.infer<typeof GetSettingsByCategorySchema>;
