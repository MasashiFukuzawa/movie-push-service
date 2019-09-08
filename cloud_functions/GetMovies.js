const puppeteer = require('puppeteer');
let page;

async function getBrowserPage() {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  return browser.newPage();
}

exports.getMovies = async (req, res) => {

  if (!page) {
    page = await getBrowserPage();
  }

  await page.goto('https://eiga.com/coming/');

  const result = await page.evaluate(getMovies);

  res.set('Content-Type', 'application/json');
  res.send(result);
};

function getMovies() {
  return [...document.querySelectorAll('.txt-box')].map(movie => {
    const a = movie.querySelector('.title > a');
    const title = a.textContent;
    const href = a.href;

    const casts = getCasts(movie);
    const description = movie.querySelector('.txt').textContent;

    return {title, href, casts, description};
  });
}

function getCasts(movie) {
  let cast_list = movie.querySelector('ul.cast-staff > li:nth-child(2)');
  if (!cast_list) {
    cast_list = movie.querySelector('ul.cast-staff > li:nth-child(1)');
  }
  const cast1 = cast_list.querySelector('span:nth-child(1)') ? cast_list.querySelector('span:nth-child(1)').textContent : '';
  const cast2 = cast_list.querySelector('span:nth-child(2)') ? cast_list.querySelector('span:nth-child(2)').textContent : '';
  const cast3 = cast_list.querySelector('span:nth-child(3)') ? cast_list.querySelector('span:nth-child(3)').textContent : '';
  const cast4 = cast_list.querySelector('span:nth-child(4)') ? cast_list.querySelector('span:nth-child(4)').textContent : '';
  const cast5 = cast_list.querySelector('span:nth-child(5)') ? cast_list.querySelector('span:nth-child(5)').textContent : '';

  const casts = {cast1, cast2, cast3, cast4, cast5};
  return casts;
}