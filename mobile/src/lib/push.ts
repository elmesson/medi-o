import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';

export async function initPush() {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;
  await PushNotifications.register();
  PushNotifications.addListener('registration', async (t) => {
    await Preferences.set({ key: 'fcm_token', value: t.value });
    // envia para backend: POST /api/notificacoes/token { token: t.value }
    try { await fetch((import.meta.env.VITE_API_URL||'http://localhost:3000')+'/api/notificacoes/token', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: t.value }) }); } catch {}
  });
  PushNotifications.addListener('pushNotificationReceived', (n) => console.log('push recebido', n));
  PushNotifications.addListener('pushNotificationActionPerformed', (a) => console.log('push action', a));
}
