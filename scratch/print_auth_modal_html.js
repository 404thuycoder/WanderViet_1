const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Running test to print the exact HTML of #modal-auth after opening...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const btn = document.querySelector('[data-auth-open]');
    if (btn) {
      console.log('Clicking data-auth-open button...');
      btn.click();
    } else {
      console.log('data-auth-open button not found!');
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const modal = document.getElementById('modal-auth');
    if (modal) {
      console.log('Found modal-auth!');
      console.log('Is hidden?', modal.hidden);
      console.log('ClassName:', modal.className);
      console.log('InnerHTML:', modal.innerHTML);
    } else {
      console.log('modal-auth not found!');
    }
  });

  await browser.close();
})();
