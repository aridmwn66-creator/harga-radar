import { z } from 'zod';

// Request validation. Responses already match the app's types (see types.ts).

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required'),
});

export const pricesQuerySchema = z.object({
  modelId: z.string().trim().min(1, 'modelId is required'),
  storageGb: z.coerce.number().int().positive().optional(),
  condition: z.enum(['new', 'used']).optional(),
  location: z.string().trim().min(1).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type PricesQuery = z.infer<typeof pricesQuerySchema>;
