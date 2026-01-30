import { ZodError } from 'zod';
type ZodIssue = ZodError['issues'][number];

export function formatZodError(issues: ZodIssue[]): string {
    return issues
        .map((issue) => {
            const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
            return `${path}${issue.message}`;
        })
        .join(', ');
}
