import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken, hashRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("refresh_token")?.value;
  if (!token) return NextResponse.json({ error: "Refresh ausente" }, { status: 401 });
  const payload = await verifyRefreshToken(token);
  if (!payload) return NextResponse.json({ error: "Refresh inválido" }, { status: 401 });
  const hashed = hashRefreshToken(token);
  const sessao = await prisma.sessao.findUnique({ where: { refreshToken: hashed } });
  if (!sessao || sessao.revogada || sessao.expiraEm < new Date()) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  const user = await prisma.inquilino.findUnique({ where: { id: payload.sub } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  const vinculos = await prisma.unidadeInquilino.findMany({ where: { inquilinoId: user.id }, select: { unidadeId: true } });
  const access = await signAccessToken({ sub: user.id, email: user.email, unidades: vinculos.map(v=>v.unidadeId) });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", access, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 15*60 });
  return res;
}
