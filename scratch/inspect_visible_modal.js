const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Inspecting visible modal elements...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const btn = document.querySelector('[data-auth-open]');
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const modal = document.getElementById('modal-auth');
    if (!modal) {
      console.log('modal-auth not found!');
      return;
    }

    console.log('--- Modal basic info ---');
    console.log('hidden:', modal.hidden);
    console.log('offsetWidth:', modal.offsetWidth);
    console.log('offsetHeight:', modal.offsetHeight);

    const children = modal.querySelectorAll('*');
    console.log('Total children inside modal:', children.length);

    children.forEach((el, idx) => {
      const style = window.getComputedStyle(el);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
      if (isVisible) {
        console.log(`Child #${idx} [${el.tagName}]: text="${el.textContent.trim().substring(0, 100)}" id="${el.id}" class="${el.className}" display="${style.display}" opacity="${style.opacity}"`);
      }
    });
  });

  await browser.close();
})();
