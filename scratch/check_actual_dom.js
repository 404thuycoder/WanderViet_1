const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Checking actual modal HTML in DOM...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const modals = document.querySelectorAll('[data-modal="auth"], #modal-auth');
    console.log('Number of auth modals found:', modals.length);
    modals.forEach((m, idx) => {
      console.log(`\n--- Auth Modal #${idx + 1} ---`);
      console.log('ID:', m.id);
      console.log('data-modal:', m.getAttribute('data-modal'));
      console.log('OuterHTML snippet:', m.outerHTML.substring(0, 1000));
    });
  });

  await browser.close();
})();
