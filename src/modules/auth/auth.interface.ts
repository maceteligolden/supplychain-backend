import { UserRole } from '@prisma/client';

/** Login request body from the client. */
export interface ILoginInput {
  /** Super Admin email address. */
  email: string;
  /** Plaintext password. */
  password: string;
}

/** Public user profile returned by auth endpoints. */
export interface IUserOutput {
  /** Unique user identifier. */
  id: string;
  /** User email address. */
  email: string;
  /** Given name displayed in the UI. */
  firstName: string;
  /** Family name displayed in the UI. */
  lastName: string;
  /** Platform role — SUPER_ADMIN in POC. */
  role: UserRole;
  /** ISO timestamp when the user was created. */
  createdAt: string;
  /** ISO timestamp when the user was last updated. */
  updatedAt: string;
}

/** Successful login response payload. */
export interface ILoginOutput {
  /** Authenticated user profile. */
  user: IUserOutput;
}

/** Token pair issued on login and refresh. */
export interface IAuthTokensOutput {
  /** Short-lived JWT access token. */
  accessToken: string;
  /** Opaque refresh token stored hashed in DB. */
  refreshToken: string;
  /** Authenticated user profile. */
  user: IUserOutput;
}

/** Refresh session response payload. */
export interface IRefreshSessionOutput {
  /** Authenticated user profile. */
  user: IUserOutput;
}

/** Logout response payload. */
export interface ILogoutOutput {
  /** Whether logout completed successfully. */
  success: boolean;
}

/** Authenticated user attached to the request after middleware. */
export interface IAuthUserOutput {
  /** Authenticated user id. */
  userId: string;
  /** Authenticated user role. */
  role: UserRole;
}

/** Internal auth result including tokens for cookie setting. */
export type IAuthSessionResultOutput = IAuthTokensOutput;
