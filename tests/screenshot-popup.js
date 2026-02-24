const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const htmlPath = 'file://' + path.resolve(__dirname, '..', 'test', 'popup-mock.html');
  const out = path.resolve(__dirname, '..', 'test', 'popup-mock.png');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 360, height: 520 } });
  const page = await context.newPage();
  await page.goto(htmlPath, { waitUntil: 'load' });
  // wait a moment for small UI changes
  await page.waitForTimeout(500);
  const root = await page.$('#popup-root');
  if (root) {
    await root.screenshot({ path: out });
    console.log('Saved screenshot to', out);
  } else {
    await page.screenshot({ path: out, fullPage: true });
    console.log('Saved full-page screenshot to', out);
  }
  await browser.close();
})();