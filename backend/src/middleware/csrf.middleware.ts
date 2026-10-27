import "../types/session";
import { timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const expected = req.session.csrfToken;
  const supplied = req.get("X-CSRF-Token");

  if (!expected || !supplied) {
    res.status(403).json({
      message: "Invalid security token.",
    });
    return;
  }

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    res.status(403).json({
      message: "Invalid security token.",
    });
    return;
  }

  next();
}