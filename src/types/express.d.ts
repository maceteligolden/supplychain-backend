import 'express';

import { IAuthUserOutput } from '@/modules/auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      /** Parsed JSON request body after route validation. */
      body: unknown;
      /** Authenticated user context set by auth middleware. */
      authUser?: IAuthUserOutput;
      /** Parsed cookies from cookie-parser. */
      cookies: Record<string, string | undefined>;
    }
  }
}

export {};
