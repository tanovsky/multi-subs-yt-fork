const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const extensionPath = root; // repo root
  const watchPath = path.join(root, 'test', 'watch.html');

  // Simple static server to serve watch.html
  const server = http.createServer((req, res) => {
    fs.readFile(watchPath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    });
  });

  const port = 8000;
  server.listen(port, () => console.log(`Test server running at http://localhost:${port}/`));

  const userDataDir = path.join(__dirname, 'tmp-user-data');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
  });

  try {
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'load' });

    // Wait for the content script/extension to write data-playerResponse on body
    try {
      await page.waitForFunction(() => document.body && document.body.hasAttribute('data-playerResponse'), { timeout: 5000 });
      const pr = await page.evaluate(() => document.body.getAttribute('data-playerResponse'));
      console.log('Found data-playerResponse:', pr ? pr.substring(0, 200) + (pr.length>200? '...':'') : pr);
    } catch (e) {
      console.warn('Timed out waiting for data-playerResponse; content script may not have run.');
    }

    // Optionally interact with the popup by opening its URL. Extension ID is not known here,
    // but we can list background pages to find the extension target if needed.

    console.log('You can now inspect the browser to test the extension popup and behavior.');

    // Keep the browser open for manual inspection for a bit
    await new Promise(resolve => setTimeout(resolve, 15000));

  } finally {
    await context.close();
    server.close();
    console.log('Finished test run.');
  }
})();
