const { chromium } = require('C:/Users/bjy32/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file:///C:/Users/bjy32/Music/insurance-insight/output/notice-review/hospital-v8.html');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.card').screenshot({ path: 'output/notice-review/hospital-preview-v8.png' });
  console.log(JSON.stringify(await page.evaluate(() => ({ height: document.querySelector('.card').scrollHeight, width: document.querySelector('.card').scrollWidth }))));
  await browser.close();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
