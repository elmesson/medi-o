import { prisma } from "@/lib/prisma";
import { log } from "@/lib/observability/logger";

export async function audit(inquilinoId: string, acao: string, alvo: string, meta: any = {}) {
  log(`audit:${acao}`, { inquilinoId, alvo, ...meta });
  // Em prod: tabela AuditLog com retention LGPD
  // await prisma.auditLog.create({ data: { inquilinoId, acao, alvo, meta: JSON.stringify(meta) } });
}
