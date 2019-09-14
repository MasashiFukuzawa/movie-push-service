const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://eiga.com/coming/');
  await page._client.send(
    'Input.synthesizeScrollGesture',
    {
      x: 0,
      y: 0,
      xDistance: 0,
      yDistance: -1000,
      repeatCount: 15,
      repeatDelayMs: 1

    }
  );
  await browser.close();
})();
