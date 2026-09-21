import { z } from 'zod';

export const UpdateWorkflowSchema = z.object({
  value: z.any(),
});

export type UpdateWorkflowDTO = z.infer<typeof UpdateWorkflowSchema>;
