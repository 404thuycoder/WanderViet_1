const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

    // Let's check if we can register/login
    console.log('Attempting login/register via localStorage token...');
    // We can register a test user directly via fetch to be sure
    const token = await page.evaluate(async () => {
      const email = `test_${Date.now()}@example.com`;
      const res = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Tester', email, password: 'password123' })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('wander_token', data.token);
        return data.token;
      }
      return null;
    });

    if (!token) {
      console.error('Failed to register test user');
      await browser.close();
      return;
    }
    console.log('Successfully registered test user. Token stored.');

    // Reload home page to apply token and load UI
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000)); // wait for syncAuthUI

    const homeRankInfo = await page.evaluate(() => {
      const el = document.getElementById('header-user-rank');
      if (!el) return { exists: false };
      return {
        exists: true,
        display: window.getComputedStyle(el).display,
        innerHTML: el.innerHTML,
        outerHTML: el.outerHTML
      };
    });
    console.log('Home Page Rank Badge Info:', homeRankInfo);

    // Navigate to planner.html
    console.log('Navigating to planner.html...');
    await page.goto('http://localhost:3000/planner.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000)); // wait for syncAuthUI

    const plannerRankInfo = await page.evaluate(() => {
      const el = document.getElementById('header-user-rank');
      if (!el) return { exists: false };
      return {
        exists: true,
        display: window.getComputedStyle(el).display,
        innerHTML: el.innerHTML,
        outerHTML: el.outerHTML
      };
    });
    console.log('Planner Page Rank Badge Info:', plannerRankInfo);

  } catch (err) {
    console.error('Error in script:', err);
  } finally {
    await browser.close();
  }
})();
