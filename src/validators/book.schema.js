import { z } from 'zod';

const isbn13 = z
  .string()
  .trim()
  .refine((value) => /^\d{13}$/.test(value.replace(/[-\s]/g, '')), 'must be a 13-digit ISBN')
  .refine((value) => {
    const digits = value.replace(/[-\s]/g, '');
    if (!/^\d{13}$/.test(digits)) return true;
    const sum = [...digits].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }, 'has an invalid ISBN-13 checksum')
  .transform((value) => value.replace(/[-\s]/g, ''));

const price = z
  .number()
  .finite()
  .min(0, 'must be between 0 and 100000')
  .max(100_000, 'must be between 0 and 100000')
  .refine((value) => Math.abs(Math.round(value * 100) - value * 100) <= 1e-9, 'must have at most 2 decimal places');

export const createBookSchema = z.strictObject({
  title: z.string().trim().min(1, 'must not be empty').max(150),
  author: z.string().trim().min(1, 'must not be empty').max(100),
  isbn: isbn13,
  price,
  publishedYear: z.int().min(1450).max(2100).optional(),
  description: z.string().trim().min(1, 'must not be empty').max(1000).optional(),
});

export const updateBookSchema = createBookSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');
