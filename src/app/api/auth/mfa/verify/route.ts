import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { signAccessToken, signRefreshToken, hashRefreshToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email, token } = await req.json();
  const user = await prisma.inquilino.findUnique({ where: { email } });
  if (!user || !user.mfaSecret) return NextResponse.json({ error: "MFA não configurado" }, { status: 400 });
  const base32 = decrypt(user.mfaSecret);
  const totp = new OTPAuth.TOTP({ issuer: "Elmesson", label: user.email, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(base32) });
  const delta = totp.validate({ token, window: 1 });
  if (delta === null) return NextResponse.json({ error: "Código inválido" }, { status: 401 });

  const vinculos = await prisma.unidadeInquilino.findMany({ where: { inquilinoId: user.id }, select: { unidadeId: true } });
  const access = await signAccessToken({ sub: user.id, email: user.email, unidades: vinculos.map(v=>v.unidadeId) });
  const jti = crypto.randomUUID();
  const refresh = await signRefreshToken({ sub: user.id, jti });
  await prisma.sessao.create({ data: { inquilinoId: user.id, refreshToken: hashRefreshToken(refresh), expiraEm: new Date(Date.now()+30*24*3600*1000) } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 15*60 });
  res.cookies.set("refresh_token", refresh, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30*24*3600 });
  res.cookies.set("mfa_pending", "", { maxAge: 0, path: "/" });
  return res;
}
