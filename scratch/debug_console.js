const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Launching browser to debug user page auth flow...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR] ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded. Checking for auth triggers...');
    
    // Check if openModal is available
    const openModalType = await page.evaluate(() => typeof window.openModal);
    console.log(`window.openModal type: ${openModalType}`);

    // Try to open the auth modal
    console.log('Opening auth modal...');
    await page.evaluate(() => window.openModal('auth'));
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if modal-auth is visible
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('modal-auth');
      return modal ? !modal.hidden : false;
    });
    console.log(`Modal visible: ${modalVisible}`);

    // Let's click the 'Đăng ký mới' tab
    console.log('Clicking "Đăng ký mới" tab...');
    await page.evaluate(() => {
      const registerTab = document.querySelector('[data-auth-tab="register"]');
      if (registerTab) {
        registerTab.click();
        return true;
      }
      return false;
    });
    
    await new Promise(r => setTimeout(r, 1000));

    // Check visibility of register panel
    const regPanelVisible = await page.evaluate(() => {
      const panel = document.querySelector('[data-auth-panel="register"]');
      return panel ? !panel.hidden : false;
    });
    console.log(`Register panel visible after click: ${regPanelVisible}`);

    // Click back to login tab
    console.log('Clicking "Đăng nhập" tab...');
    await page.evaluate(() => {
      const loginTab = document.querySelector('[data-auth-tab="login"]');
      if (loginTab) {
        loginTab.click();
        return true;
      }
      return false;
    });
    
    await new Promise(r => setTimeout(r, 1000));

    // Click "Quên mật khẩu?" link
    console.log('Clicking "Quên mật khẩu?" link...');
    await page.evaluate(() => {
      const forgotLink = document.querySelector('[data-auth-forgot-trigger]');
      if (forgotLink) {
        forgotLink.click();
        return true;
      }
      return false;
    });
    
    await new Promise(r => setTimeout(r, 1000));

    // Check visibility of forgot panel
    const forgotPanelVisible = await page.evaluate(() => {
      const panel = document.querySelector('[data-auth-panel="forgot"]');
      return panel ? !panel.hidden : false;
    });
    console.log(`Forgot panel visible after click: ${forgotPanelVisible}`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
