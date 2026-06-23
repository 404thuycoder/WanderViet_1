const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600 });

  console.log('Navigating to planner page...');
  await page.goto('http://localhost:3000/planner.html', { waitUntil: 'networkidle2' });

  // Input destination: Hà Nội
  console.log('Setting destination to Hà Nội...');
  await page.evaluate(() => {
    const destInput = document.getElementById('dest');
    if (destInput) {
      destInput.value = 'Hà Nội';
      destInput.dispatchEvent(new Event('input'));
      destInput.dispatchEvent(new Event('change'));
    }
    const daysInput = document.getElementById('days');
    if (daysInput) {
      daysInput.value = '3';
      daysInput.dispatchEvent(new Event('input'));
      daysInput.dispatchEvent(new Event('change'));
    }
  });

  // Wait for attractions to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click some spot items in Step 1
  console.log('Selecting spots in Step 1...');
  await page.evaluate(() => {
    // Select first few spots
    const spotCheckboxes = document.querySelectorAll('.spot-checkbox');
    console.log('Found spot checkboxes:', spotCheckboxes.length);
    for (let i = 0; i < Math.min(5, spotCheckboxes.length); i++) {
      if (!spotCheckboxes[i].checked) {
        spotCheckboxes[i].click();
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Go to step 2
  console.log('Moving to Step 2...');
  await page.evaluate(() => {
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) nextBtn.click();
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Click on Di chuyển to expand
  console.log('Expanding Transport and selecting vehicle...');
  await page.evaluate(() => {
    const transportHeader = document.querySelector('#transportSubPanel')?.previousElementSibling?.previousElementSibling || 
                            document.getElementById('transportSubPanel')?.parentNode?.querySelector('.bb-header');
    if (transportHeader) {
      transportHeader.click();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Click Grab option
  await page.evaluate(() => {
    const grabOption = document.querySelector('#transportVehicleList div');
    // Click the second one if exists (Grab)
    const options = document.querySelectorAll('#transportVehicleList > div');
    if (options && options[1]) {
      options[1].click();
    }
  });

  // Click on Food and Entertain to expand
  console.log('Expanding Food and Entertain panels...');
  await page.evaluate(() => {
    const foodHeader = document.querySelector('#foodSubPanel')?.parentNode?.querySelector('.bb-header');
    if (foodHeader) foodHeader.click();
    
    const entertainHeader = document.querySelector('#entertainSubPanel')?.parentNode?.querySelector('.bb-header');
    if (entertainHeader) entertainHeader.click();
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Capture screenshot of the budget estimate breakdown
  const screenshotPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\115eb60c-d8b7-4c68-8410-a75bf7d340c4\\budget_updates_verification.png';
  console.log(`Taking screenshot at ${screenshotPath}...`);
  
  // Crop to show the right panel (Budget breakdown)
  const element = await page.$('.planner-right');
  if (element) {
    await element.screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({ path: screenshotPath });
  }

  console.log('Verification completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error occurred:', err);
  process.exit(1);
});
