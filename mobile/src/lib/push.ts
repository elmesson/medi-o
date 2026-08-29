import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';

export async function initPush() {
  // Desativado até configurar Firebase google-services.json
  // Sem Firebase o app crasha em PushNotifications.register()
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
    await PushNotifications.register();
    PushNotifications.addListener('registration', async (t) => {
      try { await Preferences.set({ key: 'fcm_token', value: t.value }); } catch {}
      try { await fetch((import.meta.env.VITE_API_URL||'http://localhost:3000')+'/api/notificacoes/token', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: t.value }) }); } catch {}
    });
    PushNotifications.addListener('pushNotificationReceived', (n) => console.log('push recebido', n));
    PushNotifications.addListener('pushNotificationActionPerformed', (a) => console.log('push action', a));
  } catch(e) {
    console.warn('[push] desativado (sem Firebase):', e);
  }
}
