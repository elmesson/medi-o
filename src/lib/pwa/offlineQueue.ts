// Fila offline para fotos, chamados e comprovantes - usa localStorage (web) / Preferences (Capacitor)
// Sincroniza quando navigator.onLine volta ou via Background Sync
export type QueueItem = { id: string; type: 'foto'|'chamado'|'comprovante'; payload: any; createdAt: string };

const KEY = 'elmesson_offline_queue';

export function enqueue(item: Omit<QueueItem,'id'|'createdAt'>) {
  const q = getQueue();
  q.push({ id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), ...item });
  localStorage.setItem(KEY, JSON.stringify(q));
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => (reg as any).sync?.register('elmesson-sync')).catch(()=>{});
  }
}
export function getQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export async function flushQueue(apiBase = '') {
  const q = getQueue();
  if (!q.length || !navigator.onLine) return { flushed: 0 };
  let flushed = 0;
  for (const item of [...q]) {
    try {
      if (item.type === 'chamado') {
        await fetch(`${apiBase}/api/chamados`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(item.payload) });
      } else if (item.type === 'foto') {
        const fd = new FormData();
        fd.append('foto', item.payload.file);
        fd.append('unidadeId', item.payload.unidadeId);
        fd.append('tipo', item.payload.tipo);
        await fetch(`${apiBase}/api/leituras/foto`, { method:'POST', body: fd });
      }
      // remove da fila
      const next = getQueue().filter(x=>x.id!==item.id);
      localStorage.setItem(KEY, JSON.stringify(next));
      flushed++;
    } catch {}
  }
  return { flushed };
}

// auto-flush ao voltar online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue());
}
