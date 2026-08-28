import { NextResponse } from "next/server";
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
  const master = await requireMaster();
  if (!master) return NextResponse.json({ error: "Acesso master requerido" }, { status: 403 });

  const [totalInquilinos, totalAdministradores, totalProprietarios, ativos, inativos, administradores, proprietarios] = await Promise.all([
    prisma.inquilino.count(),
    prisma.administrador.count({ where: { papel: "ADMINISTRADOR" } }),
    prisma.administrador.count({ where: { papel: "PROPRIETARIO" } }),
    prisma.administrador.count({ where: { ativo: true, papel: { in: ["ADMINISTRADOR","PROPRIETARIO"] } } }),
    prisma.administrador.count({ where: { ativo: false, papel: { in: ["ADMINISTRADOR","PROPRIETARIO"] } } }),
    prisma.administrador.findMany({ where: { papel: "ADMINISTRADOR" }, select: { id: true, nome: true } }),
    prisma.administrador.findMany({ where: { papel: "PROPRIETARIO" }, select: { id: true, nome: true } }),
  ]);

  // Inquilinos por proprietário/administrador via vínculo unidades
  // Conta unidades vinculadas a cada admin e inquilinos nessas unidades
  const adminUnidades = await prisma.administradorUnidade.groupBy({ by: ["administradorId"], _count: { unidadeId: true } });
  const inquilinosPorAdmin: Record<string, number> = {};
  for (const g of adminUnidades) {
    const unidadesIds = (await prisma.administradorUnidade.findMany({ where: { administradorId: g.administradorId }, select: { unidadeId: true } })).map(x=>x.unidadeId);
    const count = await prisma.unidadeInquilino.count({ where: { unidadeId: { in: unidadesIds } } });
    inquilinosPorAdmin[g.administradorId] = count;
  }

  // Contratos a expirar em 15 dias
  const em15Dias = new Date(Date.now()+15*24*3600*1000);
  const expirando = await prisma.administrador.findMany({ where: { papel: { in: ["ADMINISTRADOR","PROPRIETARIO"] }, dataExpiracao: { lte: em15Dias, gte: new Date() } }, select: { id:true, nome:true, papel:true, plano:true, dataExpiracao:true } });

  return NextResponse.json({
    totais: { inquilinos: totalInquilinos, administradores: totalAdministradores, proprietarios: totalProprietarios, ativos, inativos },
    detalhe: { administradores: administradores.length, proprietarios: proprietarios.length },
    inquilinosPorAdmin,
    expirando,
  });
}
