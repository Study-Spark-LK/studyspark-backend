import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const libraryItemSchema = z.object({
	id: z.string().openapi({ example: 'mat_123' }),
	title: z.string().openapi({ example: 'Neural Networks Lecture 1' }),

	fileUrl: z.url().openapi({ example: 'https://r2.studyspark.lk/file.pdf' }),

	fileType: z.enum(['pdf', 'image', 'text']).openapi({ example: 'pdf' }),
	subject: z.string().openapi({ example: 'AI' }),
	isFavorite: z.boolean().openapi({ example: false }),

	createdAt: z.iso.datetime(),
});

export const createLibraryItemSchema = z.object({
    title: z.string().min(3),
	description: z.string().optional(),
    fileUrl: z.url(),
    fileType: z.enum(['pdf', 'image', 'text']),
    subject: z.string().optional().default('General'),
});

export const searchLibrarySchema = z.object({
	q: z.string().optional().openapi({ example: 'neural' }),
	subject: z.string().optional(),
	isFavorite: z.enum(['true', 'false']).optional(),
});
