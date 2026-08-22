const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 440, height: 850 });
    await page.goto('http://localhost:8085/');
    console.log('Navigated to http://localhost:8085/');

    await page.screenshot({ path: 'scratch_step0_closed.png' });

    // Click on #weiOverlay
    await page.click('#weiOverlay');
    console.log('Clicked #weiOverlay');

    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: `scratch_step${i}_opening.png` });
    }

    await browser.close();
  } catch (err) {
    console.error('Error during click test:', err);
  }
})();
