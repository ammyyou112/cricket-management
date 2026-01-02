import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ResponseUtil } from '@/utils/response';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        console.log('❌ Validation failed for:', req.path);
        console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
          console.log(`  - ${path}: ${err.message}`);
        });

        ResponseUtil.validationError(res, errors);
        return;
      }
      next(error);
      return;
    }
  };
};
