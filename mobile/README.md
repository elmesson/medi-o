# Elmesson Mobile — App Android Inquilino

Fase 2 do Portal do Inquilino: **Android nativo com Capacitor 5**.

## Features
- **Push Notifications (FCM)** `src/lib/push.ts:1` — registro de token em `POST /api/notificacoes/token`, listeners `pushNotificationReceived/ActionPerformed`, disparo via Firebase Admin SDK no backend em eventos `NOVA_FATURA`, `VENCIMENTO_PROXIMO`, `PAGAMENTO_CONFIRMADO`, `CONTESTACAO_RESPONDIDA`.
- **Leitura por Foto** `src/screens/LeituraFoto.tsx:1` — `@capacitor/camera` → `POST /api/leituras/foto` (multipart) → OCR (Tesseract.js / Cloud Vision) no backend `src/app/api/leituras/foto/route.ts:1` com validação por isolamento de unidade e threshold de confiança (≥95% auto, senão `PENDENTE_VALIDACAO`).
- **Chamados** `src/screens/Chamados.tsx:1` e **PIX** `src/screens/Pix.tsx:1` reutilizam APIs web (`/api/chamados`, `/api/faturas/[id]/pix`).

## Rodar
```bash
cd mobile
npm install
npm run dev # web preview http://localhost:5173
# Android
npx cap add android
npx cap sync android
npx cap open android # Android Studio -> Run
# Build APK
npm run android:build # android/app/build/outputs/apk/debug/app-debug.apk
```

## Backend já pronto
- `POST /api/leituras/foto` valida `unidadeId` com `assertUnidadeAcesso`, simula OCR e cria `Notificacao` para equipe.
- `POST /api/notificacoes/token` registra FCM token.

## Próximos passos
- Integrar Firebase Admin no backend (`firebase-admin`) para `sendToDevice` nos hooks de fatura/pagamento.
- Trocar mock OCR por `tesseract.js` ou `google-cloud-vision` + crop/deskew.
- Adicionar biometria (`@capacitor/biometrics`) e offline queue (Preferences + Background Sync).
