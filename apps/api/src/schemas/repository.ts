import { z } from 'zod';

export const ImportRepositorySchema = z.object({
  path: z
    .string({
      required_error: 'Repository path is required',
      invalid_type_error: 'Repository path must be a string',
    })
    .min(1, 'Repository path is required')
    .trim(),
});

export type ImportRepositoryInput = z.infer<typeof ImportRepositorySchema>;
