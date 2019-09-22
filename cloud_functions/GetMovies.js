const puppeteer = require('puppeteer');

async function getBrowserPage() {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  return browser.newPage();
}

exports.getMovies = async (_, res) => {
  const page = await getBrowserPage();

  const date = new Date();
  const year  = date.getFullYear(),
        month = ("0"+(date.getMonth()+2)).slice(-2);
  const url = `https://eiga.com/coming/${year}${month}/`;
  await page.goto(url, {waitUntil: 'load'});

  // NOTE: 画像のsrcが読み込めない問題への対策
  // 一度画面をスクロールしてからスクレイピングすれば画像のsrcが正しく読み込める
  // 参考1: https://wiki.zegnat.net/cache/?md5=f7ce4fd73de0ac41f15ea708b4c8f20f
  // 参考2: https://thr3a.hatenablog.com/entry/20190215/1550190060
  await page._client.send(
    'Input.synthesizeScrollGesture',
    {
      x: 0,
      y: 0,
      xDistance: 0,
      yDistance: -3000, // 適当
      speed: 1000,      // スクロール速度が1500以上だと画像が取得できない場合があった
      repeatCount: 10,  // 画面があまりに長すぎなければスクロール10回以内でフッターまで到達する
      repeatDelayMs: 1, // 適当
    }
  );

  const result = await page.evaluate(getMovies);

  res.set('Content-Type', 'application/json');
  res.send(result.filter(function(e){return e}));
};

function getMovies() {
  return [...document.querySelector('section').children].map(element => {
    if (element.tagName === 'H2') {
      const release_date = element.querySelector('span.icon.calendar').textContent;
      this.release_date = release_date;
    } else if (element.tagName === 'DIV') {
      const txt_box = element.querySelector('.txt-box');
      const a = txt_box.querySelector('.title > a');
      const title = a.textContent;
      const href = a.href;

      // HACK: getCasts(element)のような形で関数に切り出したいが、呼び出し時にエラーが出て上手く行かなかったため保留
      //----------------------------------------------------------------------------------------------------------------
      // NOTE: 映画.comのHTMLの構造上の都合によりli:nth-child(2)がない時があるのでエラーを吐かないように対処
        const cast_staff = Array.from({length: 2}).map((_, i) =>
        element.querySelector(`ul.cast-staff > li:nth-child(${i + 1})`)
      );

      let casts;
      if (cast_staff[1]) {
        casts = Array.from({length: 5}).map((_, j) =>
          cast_staff[1].querySelector(`span:nth-child(${j + 1})`) ? cast_staff[1].querySelector(`span:nth-child(${j + 1})`).textContent : ''
        );
      } else if (cast_staff[0]) {
        casts = Array.from({length: 5}).map((_, j) =>
          cast_staff[0].querySelector(`span:nth-child(${j + 1})`) ? cast_staff[0].querySelector(`span:nth-child(${j + 1})`).textContent : ''
        );
      } else {
        casts = [];
      }
      //----------------------------------------------------------------------------------------------------------------

      const src = element.querySelector('.img-box > a > img').src;

      const movie = {
        release_date: release_date,
        title: title,
        href: href,
        cast1: casts[0] || '',
        cast2: casts[1] || '',
        cast3: casts[2] || '',
        cast4: casts[3] || '',
        cast5: casts[4] || '',
        src: src,
        new_arrival_flag: 0,
        just_before_release_flag: 0,
        google_calender_flag: 0,
      };
      return movie;
    }
  });
}
