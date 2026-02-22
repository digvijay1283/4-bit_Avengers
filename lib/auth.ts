import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { cookies, headers } from "next/headers";

const JWT_SECRET: string =
  process.env.JWT_SECRET ?? "dev-insecure-secret-change-before-deploy";

// 7 days in seconds — use a number to avoid the StringValue type constraint
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: "user" | "doctor";
  fullName: string;
};

// ─── Password helpers ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

const SIGN_OPTIONS: SignOptions = {
  expiresIn: JWT_EXPIRES_IN_SECONDS,
  issuer: "vitalai",
  audience: "vitalai-app",
};

const VERIFY_OPTIONS: jwt.VerifyOptions = {
  issuer: "vitalai",
  audience: "vitalai-app",
};

export function signAuthToken(payload: {
  sub: string;
  email: string;
  role: "user" | "doctor";
  fullName: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, SIGN_OPTIONS);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET, VERIFY_OPTIONS) as AuthTokenPayload;
}

/**
 * Extract the auth token from either the Authorization Bearer header (mobile)
 * or the httpOnly auth_token cookie (web). Use this in any API route
 * that needs the raw JWT token.
 */
export async function getTokenFromRequest(): Promise<string | undefined> {
  // 1. Try Bearer token from Authorization header (mobile / API clients)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Fall back to httpOnly cookie (web client)
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}
