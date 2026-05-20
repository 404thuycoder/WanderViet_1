const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Tracing click listeners...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => console.error(`[PAGEERROR] ${err.toString()}`));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.openModal('auth'));
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const tab = document.querySelector('[data-auth-tab="register"]');
    console.log('--- Register Tab properties ---');
    console.log('onclick handler:', tab.onclick ? tab.onclick.toString() : 'none');
    
    // Let's add a custom event listener to see if event bubbles or gets stopped
    tab.addEventListener('click', (e) => {
      console.log('Click event bubbled to register tab custom listener!');
      console.log('event target:', e.target.outerHTML);
      console.log('event defaultPrevented:', e.defaultPrevented);
    });

    document.addEventListener('click', (e) => {
      console.log('Click event bubbled to document!', e.target.outerHTML);
    });
  });

  console.log('\nClicking register tab in browser...');
  await page.click('[data-auth-tab="register"]');

  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
