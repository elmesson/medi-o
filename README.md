# Elmesson Measurement — Portal do Inquilino

Portal exclusivo para o inquilino acompanhar em tempo real consumos, cobranças, faturas, histórico de medições e solicitações. Acesso restrito às unidades vinculadas.

Inspirado em Nubank / Inter / Mercado Pago / QuintoAndar — **mobile-first**, com instalação PWA pronta para evoluir para app Android com push, foto do medidor e PIX.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind + Prisma (SQLite dev, Postgres prod) + JWT + Refresh + TOTP MFA + AES-256-GCM + Recharts + jsPDF + ExcelJS.

## Módulos implementados
- **Dashboard**: consumo atual energia/água/gás, condomínio, total faturado, faturas em aberto/vencidas, próximo vencimento, gráfico 12m, indicadores (aumento/redução/média/alerta >20%).
- **Leituras**: energia (anterior/atual/kWh/bandeira/tarifa), água e gás (m³), histórico completo. `GET /api/leituras?unidadeId=&tipo=&ano=`.
- **Histórico**: filtros mês/ano/tipo, tabela + gráfico comparativo, export PDF/Excel/CSV. `GET /api/relatorios/export?formato=csv|pdf|excel`.
- **Faturas**: por tipo (energia/água/gás/condomínio/taxas), rateio/critério, emissão/vencimento/status (aberta/paga/vencida/em contestação). `GET /api/faturas`.
- **Documentos**: download PDF faturas/demonstrativos/histórico/extratos via `/api/faturas/[id]/pdf`.
- **PIX**: QR Code + copia e cola por fatura (`/api/faturas/[id]/pix`), upload/download comprovante (`POST /api/faturas` com comprovantePix).
- **Contestação**: categorias (leitura/valor/rateio/cobrança indevida/outro), anexos, fluxo Aberto→Recebido→Em análise→Respondido→Resolvido→Encerrado. `POST /api/contestacoes`.
- **Atendimento**: chamados por categoria + chat estilo mensagens. `POST /api/chamados`.
- **Notificações**: nova fatura, vencimento, pagamento, contestação, alteração cadastro; canais sistema/e-mail/WhatsApp (webhook). `GET /api/notificacoes`.
- **Perfil**: atualizar telefone/e-mail/senha, configurar notificações; CPF/CNPJ/unidade/contrato bloqueados. MFA TOTP setup/verify.
- **Relatórios**: consumo mensal/anual, pagamentos, faturas, contestações; export PDF/Excel/CSV.
- **Segurança**: JWT (15m) + Refresh (30d) com controle de sessão (`Sessao`), MFA TOTP (`otpauth`), criptografia AES-256-GCM para CPF/MFA secret, middleware `requireAuth` com isolamento por `unidadeId` (assertUnidadeAcesso), cookies httpOnly.

## Rodar
```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # cria demo@elmesson.com.br / demo123 + unidade BL-A-101 + 12 meses de leituras
npm run dev       # http://localhost:3000
```
Login demo: `demo@elmesson.com.br` / `demo123` (sem MFA; ative em /portal/perfil).

## Estrutura
```
src/app/page.tsx                # landing
src/app/login/page.tsx          # login + MFA
src/app/(portal)/layout.tsx     # nav mobile + sidebar desktop
src/app/(portal)/portal/*       # dashboard, leituras, historico, faturas, pix, contestacoes, atendimento, perfil, notificacoes
src/app/api/*                   # auth, dashboard, leituras, faturas, contestacoes, chamados, notificacoes, perfil, relatorios
prisma/schema.prisma            # modelos completos
```

## Próximos passos (app Android)
- Capacitor/Cordova wrapper + push (FCM) consumindo `/api/notificacoes`
- Leitura por foto: endpoint `/api/leituras/foto` com OCR (Tesseract/Cloud Vision) + validação humana
- PIX: integração PSP (ex.: Gerencianet/EFI) para gerar `pixQrCode` dinâmico por fatura

## Produção
Trocar `DATABASE_URL` para Postgres, definir `JWT_SECRET`/`ENCRYPTION_KEY` fortes, `secure: true` nos cookies, rate limit e e-mail/WhatsApp providers (Resend/Twilio).
