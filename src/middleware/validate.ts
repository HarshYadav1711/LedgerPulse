import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

type SchemaMap = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/**
 * Validates `body`, `query`, and/or `params` with Zod and replaces `req` slices with parsed values.
 */
export function validate(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        next(e);
        return;
      }
      next(e);
    }
  };
}
