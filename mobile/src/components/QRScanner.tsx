import { useEffect, useRef, useState } from 'react';
import { decodeQRFromImageData, validarCodigoMedidor } from '../lib/qr';

export default function QRScanner({ onDetect, onClose }: { onDetect: (codigo: string)=>void; onClose: ()=>void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let ativo = true;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('Câmera não suportada neste WebView. Use "Digitar código" ou "Anexar foto do QR".');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanLoop();
        }
      } catch (e: any) {
        setErro(`Câmera bloqueada: ${e?.message || e}\nVá em Configurações > Apps > Elmesson > Permissões > Câmera > Permitir`);
      }
    }

    function scanLoop() {
      if (!ativo) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      const w = video.videoWidth, h = video.videoHeight;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { rafRef.current = requestAnimationFrame(scanLoop); return; }
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const codigo = decodeQRFromImageData(img.data, w, h);
      if (codigo) {
        const v = validarCodigoMedidor(codigo);
        if (v.valido) {
          ativo = false;
          stop();
          onDetect(codigo.trim());
          return;
        }
        // QR detectado mas formato desconhecido — ainda retorna
        ativo = false;
        stop();
        onDetect(codigo.trim());
        return;
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    }

    function stop() {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    }

    start();
    return () => { ativo = false; cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  function validarManual() {
    const v = validarCodigoMedidor(codigoManual);
    if (!v.valido) { alert(v.erro); return; }
    onDetect(codigoManual.trim().toUpperCase());
  }

  // Foto do QR como fallback — decode via canvas
  async function onFotoQR(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const codigo = decodeQRFromImageData(data.data, canvas.width, canvas.height);
      if (codigo) onDetect(codigo.trim());
      else alert('QR não detectado na foto. Tente foto mais nítida, bem iluminada, QR centralizado.');
    };
    img.onerror = () => alert('Falha ao ler imagem');
    img.src = URL.createObjectURL(file);
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 text-white">
        <b className="text-sm">Escanear QR — Energia Elétrica</b>
        <button onClick={onClose} className="bg-white text-black rounded-full px-3 py-1 text-sm">✕ Fechar</button>
      </div>

      {erro ? (
        <div className="m-4 bg-amber-100 text-amber-900 rounded-2xl p-4 text-sm whitespace-pre-wrap">{erro}</div>
      ) : (
        <div className="relative flex-1 bg-black grid place-items-center overflow-hidden">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {/* mira */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            <span className="absolute bottom-6 text-white text-xs bg-black/50 px-2 py-1 rounded">Alinhe o QR dentro da moldura</span>
          </div>
        </div>
      )}

      <div className="bg-white p-3 space-y-2">
        <div className="flex gap-2">
          <input value={codigoManual} onChange={e=>setCodigoManual(e.target.value)} placeholder="Ou digite MED-XXXX-XXXX" className="flex-1 border rounded-xl px-3 py-2 text-sm font-mono" />
          <button onClick={validarManual} className="bg-zinc-900 text-white rounded-xl px-4 text-sm">Validar</button>
        </div>
        <label className="flex items-center justify-center gap-2 bg-zinc-100 border rounded-xl py-2 text-sm cursor-pointer">
          📎 Anexar foto do QR <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFotoQR} />
        </label>
        <p className="text-[11px] text-zinc-500">Dica: limpe o visor do medidor, aproxime 15-20cm, QR bem iluminado sem reflexo.</p>
      </div>
    </div>
  );
}
