const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export async function api(path: string, init?: RequestInit) {
  const token = localStorage.getItem('access_token');
  const headers: any = { ...(init?.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function uploadFoto(file: File, unidadeId: string, tipo: string) {
  const fd = new FormData();
  fd.append('foto', file);
  fd.append('unidadeId', unidadeId);
  fd.append('tipo', tipo);
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/api/leituras/foto`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
