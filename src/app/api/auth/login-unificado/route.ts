import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import * as jose from "jose";
import crypto from "crypto";
import { hashRefreshToken } from "@/lib/auth";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev-refresh");

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();
  // 1) Tenta Inquilino
  const inquilino = await prisma.inquilino.findUnique({ where: { email } });
  if (inquilino && inquilino.ativo) {
    const ok = await verifyPassword(senha, inquilino.senhaHash);
    if (ok) {
      const vinculos = await prisma.unidadeInquilino.findMany({ where: { inquilinoId: inquilino.id }, select: { unidadeId: true } });
      const access = await new jose.SignJWT({ sub: inquilino.id, email, papel: "INQUILINO", unidades: vinculos.map(v=>v.unidadeId) } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("15m").sign(SECRET);
      const jti = crypto.randomUUID();
      const refresh = await new jose.SignJWT({ sub: inquilino.id, jti } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(REFRESH_SECRET);
      await prisma.sessao.create({ data: { inquilinoId: inquilino.id, refreshToken: hashRefreshToken(refresh), expiraEm: new Date(Date.now()+30*24*3600*1000) } });
      const res = NextResponse.json({ ok: true, papel: "INQUILINO", redirect: "/portal" });
      res.cookies.set("access_token", access, { httpOnly: true, sameSite:"lax", path:"/", maxAge:15*60 });
      res.cookies.set("refresh_token", refresh, { httpOnly: true, sameSite:"lax", path:"/", maxAge:30*24*3600 });
      // também seta admin cookie vazio para evitar conflito
      return res;
    }
  }
  // 2) Tenta Administrador (MASTER/ADMINISTRADOR/PROPRIETARIO)
  const admin = await prisma.administrador.findUnique({ where: { email } });
  if (admin && admin.ativo) {
    const ok = await verifyPassword(senha, admin.senhaHash);
    if (ok) {
      const access = await new jose.SignJWT({ sub: admin.id, email, papel: admin.papel } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("15m").sign(SECRET);
      const jti = crypto.randomUUID();
      const refresh = await new jose.SignJWT({ sub: admin.id, jti } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(REFRESH_SECRET);
      await prisma.sessaoAdmin.create({ data: { administradorId: admin.id, refreshToken: hashRefreshToken(refresh), expiraEm: new Date(Date.now()+30*24*3600*1000) } });
      const redirect = admin.papel === "MASTER" ? "/admin" : "/gestao";
      const res = NextResponse.json({ ok: true, papel: admin.papel, redirect });
      res.cookies.set("admin_access_token", access, { httpOnly: true, sameSite:"lax", path:"/", maxAge:15*60 });
      res.cookies.set("admin_refresh_token", refresh, { httpOnly: true, sameSite:"lax", path:"/", maxAge:30*24*3600 });
      // também seta access_token para compatibilidade com middleware que lê ambos
      res.cookies.set("access_token", access, { httpOnly: true, sameSite:"lax", path:"/", maxAge:15*60 });
      return res;
    }
  }
  return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
}
