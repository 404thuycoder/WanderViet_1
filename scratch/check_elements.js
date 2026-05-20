const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Checking elements count and timing...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => console.error(`[PAGEERROR] ${err.toString()}`));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    console.log('--- Inside page context check ---');
    const authTabs = document.querySelectorAll("[data-auth-tab]");
    const authPanels = document.querySelectorAll("[data-auth-panel]");
    console.log('Found authTabs count:', authTabs.length);
    console.log('Found authPanels count:', authPanels.length);
  });

  await browser.close();
})();
