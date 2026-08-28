import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const prisma = new PrismaClient();

function hashDoc(doc: string){ return crypto.createHash("sha256").update(doc.replace(/\D/g,"")).digest("hex"); }
function pixPayload(valor: number){
  return `00020126580014BR.GOV.BCB.PIX0136fake-pix-key-${valor}520400005303986540${valor.toFixed(2)}5802BR5925ELMESSON CONDOMINIO6009SAO PAULO6304ABCD`;
}

async function main(){
  const senha = await bcrypt.hash("demo123",10);
  const doc = "12345678909";
  const inquilino = await prisma.inquilino.upsert({
    where: { email: "demo@elmesson.com.br" },
    update: {},
    create: {
      nome: "Inquilino Demo",
      email: "demo@elmesson.com.br",
      telefone: "(11) 99999-0000",
      cpfCnpj: "enc:"+doc,
      cpfCnpjHash: hashDoc(doc),
      senhaHash: senha,
      mfaEnabled: false,
    }
  });

  const unidade = await prisma.unidade.upsert({
    where: { identificacao: "BL-A-101" },
    update: {},
    create: { bloco: "A", numero: "101", identificacao: "BL-A-101" }
  });
  const unidade2 = await prisma.unidade.upsert({
    where: { identificacao: "BL-A-102" },
    update: {},
    create: { bloco: "A", numero: "102", identificacao: "BL-A-102" }
  });

  await prisma.unidadeInquilino.upsert({
    where: { inquilinoId_unidadeId: { inquilinoId: inquilino.id, unidadeId: unidade.id } },
    update: {},
    create: { inquilinoId: inquilino.id, unidadeId: unidade.id }
  });

  // contrato
  const contrato = await prisma.contrato.upsert({
    where: { numero: "CTR-2026-0001" },
    update: {},
    create: { numero: "CTR-2026-0001", inicio: new Date("2026-01-01"), valor: 2500 }
  });
  await prisma.unidadeInquilino.updateMany({ where: { inquilinoId: inquilino.id, unidadeId: unidade.id }, data: { contratoId: contrato.id } });

  // leituras 12 meses
  for (let i=0;i<12;i++){
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const ref=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const energiaPrev= 1000+i*25, energiaCurr= energiaPrev+ 260+Math.round(Math.random()*40);
    const aguaPrev= 50+i*2, aguaCurr= aguaPrev+ 10+Math.round(Math.random()*3);
    const gasPrev= 30+i*1, gasCurr= gasPrev+ 8+Math.round(Math.random()*3);
    for (const [tipo, prev, curr, tarifa, bandeira] of [
      ["ENERGIA", energiaPrev, energiaCurr, 0.92, i%3===0?"VERDE":i%3===1?"AMARELA":"VERMELHA_P1"],
      ["AGUA", aguaPrev, aguaCurr, 6.5, null],
      ["GAS", gasPrev, gasCurr, 7.2, null],
    ] as const){
      await prisma.leitura.upsert({
        where: { unidadeId_tipo_referencia: { unidadeId: unidade.id, tipo: tipo as any, referencia: ref } },
        update: {},
        create: { unidadeId: unidade.id, tipo: tipo as any, referencia: ref, leituraAnterior: prev, leituraAtual: curr, consumo: curr-prev, tarifa: tarifa as any, bandeira: bandeira as any, dataLeitura: d }
      });
    }
  }

  // faturas
  const tipos: any[] = ["ENERGIA","AGUA","GAS","CONDOMINIO"];
  for (let i=0;i<6;i++){
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const ref=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    for (const t of tipos){
      const id=`${ref}-${t}-${unidade.id.slice(0,4)}`;
      const exists = await prisma.fatura.findFirst({ where: { unidadeId: unidade.id, referencia: ref, tipo: t } });
      if (exists) continue;
      const valor = t==="CONDOMINIO"?542.5:t==="ENERGIA"?280:t==="AGUA"?74:65;
      const venc = new Date(d.getFullYear(), d.getMonth(), 10);
      const status = i===0? "ABERTA" : i===1 && t==="CONDOMINIO" ? "VENCIDA" : "PAGA";
      await prisma.fatura.create({
        data: {
          unidadeId: unidade.id, tipo: t, referencia: ref, valorTotal: valor, criterioRateio: t==="CONDOMINIO"?"Fração ideal 0.82%":"Medição individual",
          rateioValor: t==="CONDOMINIO"?valor:undefined,
          dataEmissao: new Date(d.getFullYear(), d.getMonth(), 1), dataVencimento: venc, dataPagamento: status==="PAGA"? new Date(venc.getTime()+86400000): null,
          status: status as any, pixTxId: `pix-${ref}-${t}-${Math.random().toString(36).slice(2,8)}`, pixQrCode: pixPayload(valor)
        }
      });
    }
  }

  await prisma.notificacao.createMany({
    data: [
      { inquilinoId: inquilino.id, tipo: "NOVA_FATURA", canal: "SISTEMA", titulo: "Nova fatura disponível", mensagem: "Fatura 08/2026 de energia disponível" },
      { inquilinoId: inquilino.id, tipo: "VENCIMENTO_PROXIMO", canal: "EMAIL", titulo: "Vencimento em 3 dias", mensagem: "Condomínio vence em 10/08/2026" },
    ]
  });

  // Master + admin/proprietario demo
  const masterHash = await bcrypt.hash("master123",10);
  await prisma.administrador.upsert({
    where: { email: "master@elmesson.com.br" },
    update: { senhaHash: masterHash, papel: "MASTER" },
    create: { nome: "Master Elmesson", email: "master@elmesson.com.br", senhaHash: masterHash, papel: "MASTER", telefone: "(11) 99999-0001" }
  });
  await prisma.administrador.upsert({
    where: { email: "admin.centro@elmesson.com.br" },
    update: {},
    create: { nome: "Admin Imóveis Centro", email: "admin.centro@elmesson.com.br", senhaHash: await bcrypt.hash("admin123",10), papel: "ADMINISTRADOR", telefone: "(11) 98888-0000" }
  });
  await prisma.administrador.upsert({
    where: { email: "joao.prop@elmesson.com.br" },
    update: {},
    create: { nome: "João Proprietário", email: "joao.prop@elmesson.com.br", senhaHash: await bcrypt.hash("prop123",10), papel: "PROPRIETARIO", telefone: "(11) 97777-0000" }
  });

  console.log("Seed ok:", inquilino.email, "unidade", unidade.identificacao, "master master@elmesson.com.br");
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
