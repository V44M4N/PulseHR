import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fail } from '../utils/response';

type Target = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/', validate(MySchema), controller.create)
 *   router.get('/',  validate(QuerySchema, 'query'), controller.list)
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = formatZodError(result.error);
      res.status(400).json(fail('VALIDATION_ERROR', message));
      return;
    }
    // Replace with parsed (coerced/transformed) values
    req[target] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map(i => `${i.path.join('.') || 'value'}: ${i.message}`)
    .join('; ');
}
