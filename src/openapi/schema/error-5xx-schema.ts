import { z } from 'zod';

// RFC 9457
export const error5xxSchema = z.object({
	message: z.string()
});
