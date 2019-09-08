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

      let cast_list = elements[i].querySelector('ul.cast-staff > li:nth-child(2)');
      if (!cast_list) {
        cast_list = elements[i].querySelector('ul.cast-staff > li:nth-child(1)');
      }
      let cast1 = cast_list.querySelector('span:nth-child(1)') ? cast_list.querySelector('span:nth-child(1)').textContent : '';
      let cast2 = cast_list.querySelector('span:nth-child(2)') ? cast_list.querySelector('span:nth-child(2)').textContent : '';
      let cast3 = cast_list.querySelector('span:nth-child(3)') ? cast_list.querySelector('span:nth-child(3)').textContent : '';
      let cast4 = cast_list.querySelector('span:nth-child(4)') ? cast_list.querySelector('span:nth-child(4)').textContent : '';
      let cast5 = cast_list.querySelector('span:nth-child(5)') ? cast_list.querySelector('span:nth-child(5)').textContent : '';
      let casts = {cast1, cast2, cast3, cast4, cast5};

      let description = elements[i].querySelector('.txt').textContent;
      let movie = {release_date, title, href, casts, description};
      movies.push(movie);
      this.movies = movies
    }
  }
  return movies;
}
