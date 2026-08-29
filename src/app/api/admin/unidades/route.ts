import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";

async function requireMaster() {
  const token = cookies().get("admin_access_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if ((payload as any).papel !== "MASTER") return null;
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  // Leitura de unidades liberada para Master e Gestão (para preencher Unidade ID)
  const tokenMaster = await requireMaster();
  if (tokenMaster) {
    const lista = await prisma.unidade.findMany({ orderBy: { identificacao: "asc" }, include: { administradores: { include: { administrador: true } }, inquilinos: true } });
    return NextResponse.json(lista);
  }
  // Tenta Gestão
  const { cookies } = await import("next/headers");
  const token = cookies().get("admin_access_token")?.value || cookies().get("access_token")?.value;
  try {
    const { payload } = await (await import("jose")).jwtVerify(token!, new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret"));
    if (["ADMINISTRADOR","PROPRIETARIO"].includes((payload as any).papel)) {
      const lista = await prisma.unidade.findMany({ orderBy: { identificacao: "asc" }, include: { administradores: { include: { administrador: true } } } });
      return NextResponse.json(lista);
    }
  } catch {}
  return NextResponse.json({ error: "Acesso Master/Gestão requerido" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso Master requerido" }, { status: 403 });
  const { identificacao, bloco, numero, fracaoIdeal, administradorId } = await req.json();
  if (!identificacao || !numero) return NextResponse.json({ error: "identificacao e numero obrigatórios" }, { status: 400 });
  try {
    const unidade = await prisma.unidade.create({ data: { identificacao, bloco: bloco||null, numero, fracaoIdeal: fracaoIdeal? Number(fracaoIdeal): 1.0 } });
    if (administradorId) {
      await prisma.administradorUnidade.create({ data: { administradorId, unidadeId: unidade.id } });
    }
    return NextResponse.json(unidade);
  } catch (e:any) {
    if (e.code==="P2002") return NextResponse.json({ error: "Unidade já existe" }, { status: 400 });
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso Master requerido" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.unidade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
