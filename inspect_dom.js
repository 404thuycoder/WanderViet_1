const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/planner.html', { waitUntil: 'networkidle0' });

  // click global chat
  await page.click('#global-chat-fab-wrap button');
  await new Promise(r => setTimeout(r, 500));

  // type query
  await page.type('#global-chat-input', 'hạ long có tour du lịch nào');
  await page.click('#global-chat-form button[type="submit"]');

  // wait for answer
  await new Promise(r => setTimeout(r, 5000));

  // Evaluate DOM
  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('.chat-tour-card');
    return Array.from(cards).map(c => ({
      rect: c.getBoundingClientRect(),
      html: c.innerHTML,
      cssText: c.style.cssText
    }));
  });

  require('fs').writeFileSync('dom_output.json', JSON.stringify(data, null, 2));

  await browser.close();
})();
