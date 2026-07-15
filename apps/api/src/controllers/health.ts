import { Request, Response, NextFunction } from 'express';
import type { HealthResponse } from '@tracemind/shared';

export const getHealth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const responseData: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};
