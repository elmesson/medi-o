import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
  const token =
    cookies().get("admin_access_token")?.value ||
    cookies().get("leiturista_access_token")?.value ||
    cookies().get("access_token")?.value;

  if (!token) return NextResponse.json({ nome: null, papel: null }, { status: 200 });

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = (payload as any).sub as string;
    const papel = (payload as any).papel as string || "INQUILINO";
    const email = (payload as any).email as string;

    // Busca nome no banco conforme papel
    let nome: string | null = null;
    if (papel === "LEITURISTA") {
      const l = await prisma.leiturista.findUnique({ where: { id: sub }, select: { nome: true } });
      nome = l?.nome || (payload as any).nome || null;
    } else if (["MASTER","ADMINISTRADOR","PROPRIETARIO"].includes(papel)) {
      const a = await prisma.administrador.findUnique({ where: { id: sub }, select: { nome: true } });
      nome = a?.nome || null;
    } else {
      const i = await prisma.inquilino.findUnique({ where: { id: sub }, select: { nome: true } });
      nome = i?.nome || null;
    }
    return NextResponse.json({ nome, email, papel });
  } catch {
    return NextResponse.json({ nome: null, papel: null }, { status: 200 });
  }
}
