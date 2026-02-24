Local Playwright test for the extension

1) Install dependencies

```bash
npm install
npx playwright install
```

2) Run the test runner

```bash
npm run test:playwright
```

What it does
- Starts a small HTTP server serving `test/watch.html` on port 8000
- Launches Chromium with this repository loaded as an unpacked extension
- Opens the test page and waits briefly for the extension/content script to write `data-playerResponse` to the document body

Notes
- `manifest.json` was temporarily updated to allow `http://localhost/*` and `http://127.0.0.1/*` so the content script runs on the local test page. Revert those changes before publishing the extension.
- The script leaves the browser open for manual inspection for ~15s; adjust the timeout in `tests/playwright-run.js` as needed.
