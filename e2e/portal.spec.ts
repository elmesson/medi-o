import { test, expect } from '@playwright/test';
test('login -> dashboard -> fatura -> pix', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input >> nth=0', 'demo@elmesson.com.br');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button:has-text("Entrar")');
  await page.waitForURL('**/portal');
  await expect(page.locator('text=Olá, Inquilino')).toBeVisible();
  await page.click('a[href="/portal/faturas"]');
  await expect(page.locator('text=Consulta de Faturas')).toBeVisible();
  await page.click('a:has-text("PIX QrCode")');
  await expect(page.locator('text=PIX Copia e Cola')).toBeVisible();
});
