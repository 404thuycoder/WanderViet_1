const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing dynamic backdrop closing on successful login...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });

  // 1. Open Auth Modal
  console.log('Opening auth modal...');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-auth-open]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Check that modal and backdrop are visible
  const initialCheck = await page.evaluate(() => {
    const modal = document.getElementById('modal-auth');
    const backdrop = document.querySelector('[data-modal-backdrop]');
    return {
      modalVisible: modal ? !modal.hidden : false,
      backdropVisible: backdrop ? !backdrop.hidden : false
    };
  });
  console.log('Initial visibility:', initialCheck);

  // 3. Directly call closeModals() which is used during login redirect
  console.log('Closing modals via closeModals()...');
  await page.evaluate(() => {
    if (typeof closeModals === 'function') {
      closeModals();
    } else {
      console.log('closeModals function not found!');
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Verify they are now hidden
  const finalCheck = await page.evaluate(() => {
    const modal = document.getElementById('modal-auth');
    const backdrop = document.querySelector('[data-modal-backdrop]');
    return {
      modalHidden: modal ? modal.hidden : true,
      backdropHidden: backdrop ? backdrop.hidden : true
    };
  });
  console.log('Final visibility:', finalCheck);

  const passed = finalCheck.modalHidden && finalCheck.backdropHidden;
  console.log(passed ? '✅ SUCCESS: Both modal and backdrop closed perfectly!' : '❌ FAILURE: Backdrop or modal is still visible!');

  await browser.close();
})();
