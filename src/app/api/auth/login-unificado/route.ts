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
  // 0) Tenta Leiturista (acesso somente Leitura)
  const leiturista = await prisma.leiturista.findUnique({ where: { email } });
  if (leiturista && leiturista.ativo) {
    const okL = await verifyPassword(senha, leiturista.senhaHash);
    if (okL) {
      const accessL = await new jose.SignJWT({ sub: leiturista.id, email, papel: "LEITURISTA", nome: leiturista.nome } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("15m").sign(SECRET);
      const jtiL = crypto.randomUUID();
      const refreshL = await new jose.SignJWT({ sub: leiturista.id, jti: jtiL } as any).setProtectedHeader({ alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(REFRESH_SECRET);
      // leiturista não tem sessao table dedicada, usa cookie
      const resL = NextResponse.json({ ok: true, papel: "LEITURISTA", redirect: "/gestao/leituras" });
      resL.cookies.set("leiturista_access_token", accessL, { httpOnly: true, sameSite:"lax", path:"/", maxAge:15*60 });
      resL.cookies.set("access_token", accessL, { httpOnly: true, sameSite:"lax", path:"/", maxAge:15*60 });
      return resL;
    }
  }
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
    if (admin.dataExpiracao && new Date(admin.dataExpiracao) < new Date() && admin.papel !== "MASTER") {
      return NextResponse.json({ error: `Contrato ${admin.plano || ""} expirado em ${new Date(admin.dataExpiracao).toLocaleDateString("pt-BR")}. Contate o Master.` }, { status: 403 });
    }
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
