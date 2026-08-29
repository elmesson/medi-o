import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'br.com.elmesson.inquilino',
  appName: 'Elmesson',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    PushNotifications: { presentationOptions: ['badge','sound','alert'] },
    Camera: { permission: 'camera' }
  }
};
export default config;
