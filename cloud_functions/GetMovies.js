const puppeteer = require('puppeteer');
const page = await getBrowserPage();

async function getBrowserPage() {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  return browser.newPage();
}

exports.getMovies = async (_, res) => {
  const url = 'https://eiga.com/coming/';
  await page.goto(url, {waitUntil: 'load'});

  await page._client.send(
    'Input.synthesizeScrollGesture',
    {
      x: 0,
      y: 0,
      xDistance: 0,
      yDistance: -1000,
      repeatCount: 15,
      repeatDelayMs: 1,
    }
  );

  const result = await page.evaluate(getMovies);

  res.set('Content-Type', 'application/json');
  res.send(result);
};

function getMovies() {
  const base_section = document.querySelector('section');
  const elements = base_section.children;

  let movies = [];
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].tagName === 'H2') {
      let release_date = elements[i].querySelector('span.icon.calendar').textContent;
      this.release_date = release_date
    } else if (elements[i].tagName === 'DIV') {
      let txt_box = elements[i].querySelector('.txt-box');
      let a = txt_box.querySelector('.title > a');
      let title = a.textContent;
      let href = a.href;

      // NOTE: 映画.comのHTMLの構造上の都合によりli:nth-child(2)がない時があるため分岐
      let cast_list = elements[i].querySelector('ul.cast-staff > li:nth-child(2)');
      if (!cast_list) {
        cast_list = elements[i].querySelector('ul.cast-staff > li:nth-child(1)');
      }
      casts = Array.from({length: 5}).map((_, j) =>
        cast_list.querySelector(`span:nth-child(${j + 1})`) ? cast_list.querySelector(`span:nth-child(${j + 1})`).textContent : ''
      );

      let description = elements[i].querySelector('.txt').textContent;
      let src = elements[i].querySelector('.img-box > a > img').src;

      let movie = {
        release_date: release_date,
        title: title,
        href: href,
        casts: casts,
        description: description,
        src: src,
        line_flag: 0, // LINEに通知したかどうかのフラグ
      }
      movies.push(movie);
      this.movies = movies
    }
  }
  return movies;
}
