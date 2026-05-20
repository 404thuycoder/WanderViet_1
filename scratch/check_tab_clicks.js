const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Running interactive check to see why click events are not firing...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => console.error(`[PAGEERROR] ${err.toString()}`));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.openModal('auth'));
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Modal state before clicking Register tab ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-auth-tab="register"]');
    console.log('Register tab element:', tab ? tab.outerHTML : 'null');
    console.log('Register tab classes:', tab ? tab.className : '');
    
    const panel = document.querySelector('[data-auth-panel="register"]');
    console.log('Register panel element:', panel ? panel.outerHTML : 'null');
    console.log('Register panel hidden:', panel ? panel.hidden : 'null');
  });

  console.log('\n--- Programmatically clicking Register tab ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-auth-tab="register"]');
    if (tab) {
      tab.click();
      console.log('Clicked register tab successfully.');
    } else {
      console.log('Register tab not found to click.');
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- Modal state after clicking Register tab ---');
  await page.evaluate(() => {
    const tab = document.querySelector('[data-auth-tab="register"]');
    console.log('Register tab classes:', tab ? tab.className : '');
    
    const panel = document.querySelector('[data-auth-panel="register"]');
    console.log('Register panel hidden:', panel ? panel.hidden : 'null');
  });

  await browser.close();
})();
