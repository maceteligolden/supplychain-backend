import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Parsed JSON request body after route validation. */
      body: unknown;
    }
  }
}

export {};
