const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  const date = new Date();
  const year  = date.getFullYear(),
        month = ("0"+(date.getMonth()+2)).slice(-2);
  const url = `https://eiga.com/coming/${year}${month}/`;

  await page.goto(url);
  await page._client.send(
    'Input.synthesizeScrollGesture',
    {
      x: 0,
      y: 0,
      xDistance: 0,
      yDistance: -3000,
      speed: 3000,
      repeatCount: 10,
      repeatDelayMs: 1,
    }
  );
  await browser.close();
})();
