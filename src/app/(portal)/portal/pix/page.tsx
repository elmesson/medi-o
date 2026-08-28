"use client";
import { useState } from "react";
import { Card } from "@/components/ui";

export default function PixPage(){
  const pixCopiaCola = "00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540542.505802BR5925ELMESSON CONDOMINIO6009SAO PAULO62070503***6304ABCD";
  const [file,setFile]=useState<File|null>(null);
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Pagamento via PIX</h1>
      <Card className="text-center space-y-3">
        <div className="w-48 h-48 mx-auto bg-white border border-zinc-200 rounded-2xl grid place-items-center text-xs text-muted">QR Code PIX<br/>(gerado no backend via /api/faturas/[id]/pix)</div>
        <div className="text-sm font-medium">PIX Copia e Cola</div>
        <div className="bg-zinc-50 rounded-2xl p-3 text-xs break-all font-mono">{pixCopiaCola}</div>
        <div className="flex gap-2 justify-center">
          <button onClick={()=>navigator.clipboard.writeText(pixCopiaCola)} className="btn-primary text-sm py-2">Copiar código</button>
          <button onClick={()=>alert("Download do QR em PNG no backend")} className="btn-ghost text-sm py-2">Baixar QR</button>
        </div>
      </Card>
      <Card className="space-y-3">
        <h3 className="font-semibold">Enviar comprovante</h3>
        <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} className="w-full text-sm" />
        <button onClick={()=> file && alert(`Comprovante ${file.name} enviado para /api/faturas (POST comprovantePix) com isolamento por unidade`)} className="btn-primary w-full text-sm py-2">Upload comprovante</button>
        <button onClick={()=>alert("Download do comprovante: GET /api/faturas/[id]/comprovante")} className="btn-ghost w-full text-sm py-2">Download comprovante</button>
      </Card>
    </div>
  );
}
