// Genera assets/img/og.png a partir de tools/og.html. Uso: node tools/og.js
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file://' + path.join(__dirname, 'og.html'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, '..', 'assets', 'img', 'og.png') });
  await browser.close();
})();
