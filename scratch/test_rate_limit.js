const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing rate limiting (429) UI feedback in Settings...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Enable request interception to mock a 429 response
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/api/auth/send-otp')) {
      console.log('Intercepted send-otp request, returning 429...');
      request.respond({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Too many requests' })
      });
    } else {
      request.continue();
    }
  });

  await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2' });

  // Inject user session
  await page.evaluate(() => {
    localStorage.setItem('wander_session', JSON.stringify({ email: 'rate_test@wanderviet.vn' }));
  });

  // Open settings
  await page.evaluate(() => {
    if (window.WanderUI && WanderUI.openModal) {
      WanderUI.openModal('settings');
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Click trigger button
  console.log('Clicking "Gửi mã OTP"...');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-pwd-request-otp]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check the error message in Step 1
  const step1Error = await page.evaluate(() => {
    const msgStep1 = document.querySelector('[data-pwd-msg-step1]');
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    return {
      text: msgStep1 ? msgStep1.textContent.trim() : 'NOT FOUND',
      color: msgStep1 ? msgStep1.style.color : '',
      step1Visible: step1 ? !step1.hidden : false,
      otpFormHidden: otpForm ? otpForm.hidden : false
    };
  });
  console.log('Step 1 Rate limit feedback:', step1Error);

  const passed1 = step1Error.text.includes('quá nhanh') && step1Error.step1Visible && step1Error.otpFormHidden;
  console.log(passed1 ? '✅ PASS: Rate limit error correctly shown in Step 1!' : '❌ FAIL');

  // Let's do the same for Step 2 "Gửi lại mã OTP"
  console.log('\nTransitioning to Step 2 manually for Resend test...');
  await page.evaluate(() => {
    const step1 = document.querySelector('[data-pwd-step="1"]');
    const otpForm = document.querySelector('[data-pwd-otp-form]');
    if (step1) step1.hidden = true;
    if (otpForm) otpForm.hidden = false;
  });

  console.log('Clicking "Gửi lại mã OTP" (Resend)...');
  await page.evaluate(() => {
    const resendBtn = document.querySelector('[data-pwd-resend-otp]');
    if (resendBtn) resendBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const step2Error = await page.evaluate(() => {
    const msgOtp = document.querySelector('[data-pwd-msg-otp]');
    return {
      text: msgOtp ? msgOtp.textContent.trim() : 'NOT FOUND',
      color: msgOtp ? msgOtp.style.color : ''
    };
  });
  console.log('Step 2 Resend Rate limit feedback:', step2Error);

  const passed2 = step2Error.text.includes('quá nhanh');
  console.log(passed2 ? '✅ PASS: Rate limit error correctly shown in Step 2 for Resend!' : '❌ FAIL');

  await browser.close();
})();
