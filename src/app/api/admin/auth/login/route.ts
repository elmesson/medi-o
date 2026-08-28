import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, hashRefreshToken } from "@/lib/auth";
import * as jose from "jose";
import crypto from "crypto";

const ADMIN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();
  const admin = await prisma.administrador.findUnique({ where: { email } });
  if (!admin || !admin.ativo) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  const ok = await verifyPassword(senha, admin.senhaHash);
  if (!ok) return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  if (admin.papel !== "MASTER" && admin.papel !== "ADMINISTRADOR") return NextResponse.json({ error: "Sem permissão admin" }, { status: 403 });

  // token admin com claim papel
  const access = await new jose.SignJWT({ sub: admin.id, email: admin.email, papel: admin.papel } as any)
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("15m").sign(ADMIN_SECRET);
  const jti = crypto.randomUUID();
  const refresh = await new jose.SignJWT({ sub: admin.id, jti } as any).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev-refresh"));
  await prisma.sessaoAdmin.create({ data: { administradorId: admin.id, refreshToken: hashRefreshToken(refresh), expiraEm: new Date(Date.now()+30*24*3600*1000) } });

  const res = NextResponse.json({ ok: true, papel: admin.papel });
  res.cookies.set("admin_access_token", access, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 15*60 });
  res.cookies.set("admin_refresh_token", refresh, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30*24*3600 });
  return res;
}
