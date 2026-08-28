import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { requireAuth } from "@/lib/requireAuth";

// Gera secret TOTP e retorna otpauth:// + QR
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ issuer: "Elmesson", label: auth.email, algorithm: "SHA1", digits: 6, period: 30, secret });
  const uri = totp.toString();
  // salva criptografado
  await prisma.inquilino.update({ where: { id: auth.userId }, data: { mfaSecret: encrypt(secret.base32), mfaEnabled: false } });
  return NextResponse.json({ uri, secret: secret.base32 });
}

export async function PUT(req: NextRequest) {
  // confirma MFA: verifica token e ativa
  const auth = await requireAuth();
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { token } = await req.json();
  const user = await prisma.inquilino.findUnique({ where: { id: auth.userId } });
  if (!user?.mfaSecret) return NextResponse.json({ error: "MFA não iniciado" }, { status: 400 });
  const { decrypt } = await import("@/lib/crypto");
  const base32 = decrypt(user.mfaSecret);
  const totp = new OTPAuth.TOTP({ issuer: "Elmesson", label: user.email, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(base32) });
  const delta = totp.validate({ token, window: 1 });
  if (delta === null) return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  await prisma.inquilino.update({ where: { id: user.id }, data: { mfaEnabled: true } });
  return NextResponse.json({ ok: true });
}
