const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing OTP-based password change flow in Settings modal...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[PAGE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => console.error(`[PAGEERROR] ${err.toString()}`));

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });

  // Inject fake user session (simulate logged in state)
  await page.evaluate(() => {
    localStorage.setItem('wander_user', JSON.stringify({ email: 'testuser@wanderviet.vn', name: 'Test User' }));
    localStorage.setItem('wander_token', 'fake_test_token');
  });

  // Open settings modal directly
  await page.evaluate(() => {
    if (window.WanderUI && WanderUI.openModal) {
      WanderUI.openModal('settings');
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Check Step 1 UI is present
  const step1Check = await page.evaluate(() => {
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    const requestBtn = document.querySelector('[data-pwd-request-otp]');
    return {
      step1Exists: !!step1,
      step1Visible: step1 && !step1.hidden,
      otpFormExists: !!otpForm,
      otpFormHidden: otpForm ? otpForm.hidden : 'N/A',
      requestBtnText: requestBtn ? requestBtn.textContent.trim() : 'NOT FOUND',
    };
  });
  console.log('\n--- TEST 1: Initial Security Panel State ---');
  console.log(JSON.stringify(step1Check, null, 2));
  const t1Pass = step1Check.step1Exists && step1Check.step1Visible && step1Check.otpFormHidden === true;
  console.log(t1Pass ? '✅ PASS' : '❌ FAIL');

  // Click "Gửi mã OTP" button and check step 2 appears
  console.log('\n--- TEST 2: Clicking "Gửi mã OTP" button ---');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-pwd-request-otp]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const step2Check = await page.evaluate(() => {
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    const msgStep1 = document.querySelector('[data-pwd-msg-step1]');
    const otpInput = document.querySelector('[data-pwd-otp-form] input[name="otp"]');
    return {
      step1Hidden: step1 ? step1.hidden : 'N/A',
      otpFormVisible: otpForm ? !otpForm.hidden : false,
      msgStep1Text: msgStep1 ? msgStep1.textContent.trim() : '',
      otpInputExists: !!otpInput,
    };
  });
  console.log(JSON.stringify(step2Check, null, 2));

  const t2Pass = step2Check.otpFormVisible || (step2Check.msgStep1Text.length > 0);
  console.log(t2Pass ? '✅ PASS — OTP step triggered' : '❌ FAIL — nothing happened');

  // Check Back button works
  console.log('\n--- TEST 3: Back button returns to Step 1 ---');
  await page.evaluate(() => {
    const backBtn = document.querySelector('[data-pwd-back-step1]');
    if (backBtn) backBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const backCheck = await page.evaluate(() => {
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    return {
      step1Visible: step1 ? !step1.hidden : false,
      otpFormHidden: otpForm ? otpForm.hidden : 'N/A',
    };
  });
  console.log(JSON.stringify(backCheck, null, 2));
  const t3Pass = backCheck.step1Visible && backCheck.otpFormHidden === true;
  console.log(t3Pass ? '✅ PASS' : '❌ FAIL');

  // Check password mismatch validation
  console.log('\n--- TEST 4: OTP Form — Password mismatch validation ---');
  // First re-open step2 manually
  await page.evaluate(() => {
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    if (step1) step1.hidden = true;
    if (otpForm) otpForm.hidden = false;
    // Fill OTP
    const otpInput = otpForm.querySelector('input[name="otp"]');
    if (otpInput) otpInput.value = '123456';
    // Fill mismatched passwords
    const pwdInput = otpForm.querySelector('input[name="newPassword"]');
    if (pwdInput) pwdInput.value = 'password1';
    const confirmInput = otpForm.querySelector('input[name="confirmPassword"]');
    if (confirmInput) confirmInput.value = 'password2';
    // Submit
    otpForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await new Promise(r => setTimeout(r, 500));

  const validationCheck = await page.evaluate(() => {
    const msgOtp = document.querySelector('[data-pwd-msg-otp]');
    return { msgOtpText: msgOtp ? msgOtp.textContent.trim() : '' };
  });
  console.log(JSON.stringify(validationCheck, null, 2));
  const t4Pass = validationCheck.msgOtpText.includes('không khớp');
  console.log(t4Pass ? '✅ PASS — Mismatch correctly caught' : '❌ FAIL');

  console.log('\n🎉 Settings OTP password change tests complete!');
  await browser.close();
})();
