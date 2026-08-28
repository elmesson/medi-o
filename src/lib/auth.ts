import * as jose from "jose";
import bcrypt from "bcryptjs";
import { hashToken } from "./crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev-refresh");

export type JwtPayload = { sub: string; email: string; unidades: string[] };

export async function hashPassword(pwd: string) {
  return bcrypt.hash(pwd, 10);
}
export async function verifyPassword(pwd: string, hash: string) {
  return bcrypt.compare(pwd, hash);
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { sub: string; jti: string }): Promise<string> {
  return new jose.SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch { return null; }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, REFRESH_SECRET);
    return payload as any;
  } catch { return null; }
}

export function hashRefreshToken(token: string) { return hashToken(token); }

// MFA helpers (TOTP) - usar otpauth no route handler
