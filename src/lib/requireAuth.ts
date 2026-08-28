import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "./auth";
import { prisma } from "./prisma";

export async function requireAuth() {
  const cookieStore = cookies();
  let token = cookieStore.get("access_token")?.value;
  if (!token) {
    const auth = headers().get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  }
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  // carregar unidades vinculadas (garantia de isolamento)
  const vinculos = await prisma.unidadeInquilino.findMany({
    where: { inquilinoId: payload.sub },
    select: { unidadeId: true }
  });
  const unidades = vinculos.map(v => v.unidadeId);
  return { userId: payload.sub, email: payload.email, unidades };
}

export function assertUnidadeAcesso(unidades: string[], unidadeId: string) {
  if (!unidades.includes(unidadeId)) {
    throw Object.assign(new Error("Acesso negado à unidade"), { status: 403 });
  }
}
