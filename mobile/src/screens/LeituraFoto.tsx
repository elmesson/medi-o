import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFoto } from '../lib/api';

export default function LeituraFoto() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function tirarFoto() {
    const photo = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source: CameraSource.Camera, quality: 90 });
    setPreview(photo.dataUrl || null);
    if (!photo.dataUrl) return;
    // converte DataUrl -> File
    const res = await fetch(photo.dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `medidor-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setLoading(true);
    try {
      const r = await uploadFoto(file, 'BL-A-101', 'ENERGIA'); // unidade selecionada
      setResult(r);
    } catch (e:any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Leitura por Foto do Medidor</h1>
      <p className="text-sm text-zinc-500">Tire foto nítida do mostrador. OCR no backend (Tesseract/Cloud Vision) + validação humana.</p>
      <button onClick={tirarFoto} className="w-full bg-emerald-600 text-white rounded-2xl py-3 font-semibold">📷 Tirar foto do medidor</button>
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
