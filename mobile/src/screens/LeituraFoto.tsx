import { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFoto } from '../lib/api';

export default function LeituraFoto() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState<string | null>(null);

  async function tirarFoto() {
    try {
      const photo = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Camera, quality: 90 });
      setPreview(photo.dataUrl || null);
      if (!photo.dataUrl) return;
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `medidor-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setLoading(true);
      try {
        const r = await uploadFoto(file, 'BL-A-101', 'ENERGIA');
        setResult(r);
      } catch (e:any) { alert('Falha upload: '+(e.message||e)); } finally { setLoading(false); }
    } catch(e:any){
      // permissão negada ou sem câmera não deve crashar o app
      alert('Câmera não disponível: '+(e?.message||e)+'\nVerifique permissão em Configurações > Apps > Elmesson > Permissões > Câmera');
    }
  }

  async function escolherGaleria(){
    try {
      const photo = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Photos, quality: 90 });
      if (!photo.dataUrl) return;
      setPreview(photo.dataUrl);
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `medidor-galeria-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setDocName(file.name); setLoading(true);
      try { const r = await uploadFoto(file, 'BL-A-101', 'ENERGIA'); setResult(r); }
      catch (e:any){ alert('Falha upload: '+(e.message||e)); } finally { setLoading(false); }
    } catch(e:any){ if(!String(e?.message||'').includes('cancel')) alert('Galeria: '+(e?.message||e)); }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]; if(!file) return;
    setDocName(file.name);
    if(file.type.startsWith('image/')){
      const url = URL.createObjectURL(file); setPreview(url);
    } else {
      setPreview(null);
    }
    setLoading(true);
    try { const r = await uploadFoto(file, 'BL-A-101', 'ENERGIA'); setResult(r); }
    catch(err:any){ alert('Falha upload documento: '+(err.message||err)); } finally { setLoading(false); e.target.value=''; }
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Leitura por Foto do Medidor</h1>
      <p className="text-sm text-zinc-500">Tire foto nítida do mostrador ou anexe documento (PDF, JPG, PNG). OCR + validação humana.</p>
      <button onClick={tirarFoto} className="w-full bg-emerald-600 text-white rounded-2xl py-3 font-semibold">📷 Tirar foto do medidor</button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={escolherGaleria} className="bg-white border border-zinc-200 rounded-2xl py-3 font-semibold text-sm">🖼️ Galeria</button>
        <button onClick={()=> fileInputRef.current?.click()} className="bg-white border border-zinc-200 rounded-2xl py-3 font-semibold text-sm">📎 Anexar documento</button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.pdf,.doc,.docx" className="hidden" onChange={onFileSelected} />
      {docName && <div className="text-xs text-zinc-600 bg-white border rounded-xl px-3 py-2">📎 {docName}</div>}
      {preview && <img src={preview} className="rounded-2xl border w-full" />}
      {loading && <div className="text-sm">Processando OCR...</div>}
      {result && (
        <div className="bg-white rounded-2xl border p-3 text-sm space-y-1">
          <div><b>Leitura detectada:</b> {result.leituraDetectada} {result.tipo==='ENERGIA'?'kWh':'m³'}</div>
          <div><b>Confiança:</b> {(result.confianca*100).toFixed(0)}%</div>
          <div className="text-xs text-zinc-500">Status: {result.status} — {result.mensagem}</div>
          <button onClick={()=>alert('Confirmado! Leitura enviada para validação.')} className="w-full mt-2 bg-zinc-900 text-white rounded-xl py-2">Confirmar leitura</button>
        </div>
      )}
    </div>
  );
}
