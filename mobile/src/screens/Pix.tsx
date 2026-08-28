export default function Pix(){
  const copiaCola = '00020126580014BR.GOV.BCB.PIX0136...6304ABCD';
  return (
    <div className="p-4 space-y-3 text-center">
      <h1 className="font-bold">Pagamento PIX</h1>
      <div className="bg-white border rounded-2xl p-4"><div className="w-40 h-40 mx-auto bg-zinc-100 rounded-xl grid place-items-center text-xs">QR Code</div><div className="mt-3 text-xs break-all font-mono bg-zinc-50 p-2 rounded-xl">{copiaCola}</div><button onClick={()=>navigator.clipboard.writeText(copiaCola)} className="mt-3 w-full bg-emerald-600 text-white rounded-xl py-2">Copiar código</button></div>
    </div>
  );
}
