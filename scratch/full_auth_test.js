const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Running full auth flow verification...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.openModal('auth'));
  await new Promise(r => setTimeout(r, 800));

  // === Test 1: Modal opens and has login panel ===
  const t1 = await page.evaluate(() => {
    const modal = document.getElementById('modal-auth');
    const loginPanel = document.querySelector('[data-auth-panel="login"]');
    return {
      modalExists: !!modal,
      modalVisible: modal && !modal.hidden,
      loginPanelExists: !!loginPanel,
      loginPanelVisible: loginPanel && !loginPanel.hidden,
      totalAuthPanels: document.querySelectorAll('[data-auth-panel]').length,
    };
  });
  console.log('\n--- TEST 1: Modal open ---');
  console.log(JSON.stringify(t1, null, 2));
  console.log(t1.modalVisible && t1.loginPanelExists && t1.totalAuthPanels === 5 ? '✅ PASS' : '❌ FAIL - expected 5 panels, no duplicate');

  // === Test 2: Register tab switch ===
  await page.evaluate(() => document.querySelector('[data-auth-tab="register"]').click());
  await new Promise(r => setTimeout(r, 500));
  const t2 = await page.evaluate(() => ({
    registerVisible: !document.querySelector('[data-auth-panel="register"]').hidden,
    loginHidden: document.querySelector('[data-auth-panel="login"]').hidden,
  }));
  console.log('\n--- TEST 2: Register tab ---');
  console.log(JSON.stringify(t2, null, 2));
  console.log(t2.registerVisible && t2.loginHidden ? '✅ PASS' : '❌ FAIL');

  // === Test 3: Forgot password trigger ===
  await page.evaluate(() => document.querySelector('[data-auth-tab="login"]').click());
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('[data-auth-forgot-trigger]').click());
  await new Promise(r => setTimeout(r, 300));
  const t3 = await page.evaluate(() => ({
    forgotVisible: !document.querySelector('[data-auth-panel="forgot"]').hidden,
    loginHidden: document.querySelector('[data-auth-panel="login"]').hidden,
    tabsHidden: document.querySelector('.auth-tabs').style.display === 'none',
  }));
  console.log('\n--- TEST 3: Forgot panel ---');
  console.log(JSON.stringify(t3, null, 2));
  console.log(t3.forgotVisible && t3.loginHidden ? '✅ PASS' : '❌ FAIL');

  // === Test 4: Back button works ===
  await page.evaluate(() => document.querySelector('[data-auth-forgot-back]').click());
  await new Promise(r => setTimeout(r, 300));
  const t4 = await page.evaluate(() => ({
    loginVisible: !document.querySelector('[data-auth-panel="login"]').hidden,
    forgotHidden: document.querySelector('[data-auth-panel="forgot"]').hidden,
    tabsShown: document.querySelector('.auth-tabs').style.display !== 'none',
  }));
  console.log('\n--- TEST 4: Back to login ---');
  console.log(JSON.stringify(t4, null, 2));
  console.log(t4.loginVisible && t4.forgotHidden ? '✅ PASS' : '❌ FAIL');

  // === Test 5: Register form submits and transitions to OTP panel ===
  await page.evaluate(() => {
    const tab = document.querySelector('[data-auth-tab="register"]');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const panel = document.querySelector('[data-auth-panel="register"]');
    panel.querySelector('[name="name"]').value = 'Test User';
    panel.querySelector('[name="email"]').value = `test_${Date.now()}@gmail.com`;
    panel.querySelector('[name="password"]').value = 'testpass123';
  });
  await page.evaluate(() => {
    const form = document.querySelector('[data-auth-panel="register"]');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 2500)); // wait for API call
  const t5 = await page.evaluate(() => ({
    regOtpPanelVisible: !document.querySelector('[data-auth-panel="register-otp"]').hidden,
    msgOtp: document.querySelector('[data-auth-msg-register-otp]')?.textContent || '',
  }));
  console.log('\n--- TEST 5: Register OTP panel transition ---');
  console.log(JSON.stringify(t5, null, 2));
  console.log(t5.regOtpPanelVisible ? '✅ PASS - OTP panel shown' : '❌ FAIL - OTP panel not shown');

  if (errors.length > 0) {
    console.log('\n⚠️  JS Errors found:');
    errors.forEach(e => console.log('  -', e));
  } else {
    console.log('\n✅ No JS console errors detected.');
  }

  await browser.close();
  console.log('\n🎉 All tests complete!');
})();
