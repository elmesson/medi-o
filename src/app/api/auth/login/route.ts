import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, hashRefreshToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();
  if (!email || !senha) return NextResponse.json({ error: "E-mail e senha obrigatórios" }, { status: 400 });
  const user = await prisma.inquilino.findUnique({ where: { email } });
  if (!user || !user.ativo) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  const ok = await verifyPassword(senha, user.senhaHash);
  if (!ok) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });

  // se MFA habilitado, não emite tokens ainda
  if (user.mfaEnabled) {
    // criar cookie temporário para validar MFA (5 min)
    const tmp = crypto.randomBytes(16).toString("hex");
    const res = NextResponse.json({ mfaRequired: true });
    res.cookies.set("mfa_pending", `${user.id}:${tmp}`, { httpOnly: true, maxAge: 300, path: "/" });
    // salvar tmp em sessão? simplificado: usa hash em memória via cookie assinado - para demo basta cookie
    return res;
  }

  return await issueTokens(user.id, user.email, req);
}

async function issueTokens(userId: string, email: string, req: NextRequest) {
  const vinculos = await prisma.unidadeInquilino.findMany({ where: { inquilinoId: userId }, select: { unidadeId: true } });
  const unidades = vinculos.map(v => v.unidadeId);
  const access = await signAccessToken({ sub: userId, email, unidades });
  const jti = crypto.randomUUID();
  const refresh = await signRefreshToken({ sub: userId, jti });
  const hashed = hashRefreshToken(refresh);
  await prisma.sessao.create({
    data: { inquilinoId: userId, refreshToken: hashed, userAgent: req.headers.get("user-agent") || undefined, ip: (req.headers.get("x-forwarded-for")||"").split(",")[0] || undefined, expiraEm: new Date(Date.now()+30*24*3600*1000) }
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 15*60 });
  res.cookies.set("refresh_token", refresh, { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 30*24*3600 });
  return res;
}
