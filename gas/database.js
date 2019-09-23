function cleanSpreadSheet() {
  var movieNum  = allMovies.length;

  const movieTitles = allMovies.map(function(movie) {
    return movie[1]
  });

  for(var i　=　0;　i　<　movieNum;　i++){
    var date        = allMovies[i][0];
    var title       = allMovies[i][1];
    var description = allMovies[i][8];

    // allMoviesのうち、A列がDate型でないものを配列から削除
    if (_releaseDateNotFixed(date)) {
      allMovies.splice(i, 1);
      movieNum--;
      i--;
      continue;
    }

    // 映画は不要なので、あらすじに「ホラー」というキーワードが入っていれば配列から削除
    if (_keywordToBeDeletedExists(description)) {
      var deletedData = allMovies.splice(i, 1);
      movieNum--;
      i--;
    }

    // allMoviesの配列中に同titleがあれば削除
    if (_duplicateDataExists(movieTitles, title, i)['bool']) {
      var index = _duplicateDataExists(movieTitles, title, i)['index'];
      allMovies = _spliceMovie(allMovies, i, index);
      movieNum--;
      i--;
    }
  }

  _updateSpreadSheet(allMovies);
}

// 以下、プライベートメソッド
//--------------------------------------------------------------------------------------

function _releaseDateNotFixed(date) {
  return Object.prototype.toString.call(date).slice(8, -1) !== 'Date';
}

function _keywordToBeDeletedExists(description) {
  return /ホラー/.test(description);
}

function _duplicateDataExists(titles, title, i) {
  const index = titles.indexOf(title);
  // 同一映画データを古い方から削除することで、imageUrlが取得できていなかったものについてアップデートが可能となる
  // ifの条件設定の意図については、下記ログを出力して挙動を確認してみると理解できる
  //Logger.log(['スプレッドシートの行番号: ' + (i + 2), '配列中での通し番号: ' + (index + 2)].join(' / '));
  //Logger.log([allMovies[i][1], allMovies[index][1]].join(' / '));
  //Logger.log('----------------------------------------------------------------------------------');
  if (index < i) {
    return {index: index, bool: true};
  } else {
    return {bool: false};
  }
}

function _spliceMovie(allMovies, i, index) {
  // 古いデータ削除する前に、古いデータの各種フラグを新しい方の映画データに引き継がせておく必要がある
  allMovies[i][10] = allMovies[index][10];
  allMovies[i][11] = allMovies[index][11];
  allMovies[i][12] = allMovies[index][12];
  allMovies.splice(i, 1);
  return allMovies;
}

function _updateSpreadSheet(allMovies) {
  const rows  = allMovies.length;
  const cols  = allMovies[0].length;
  const range = ws.getRange(2, 1, rows, cols);

  // 一度シートを全消しした後、必要なデータだけを再度セットしていく
  ws.clearContents();
  ws.getRange(1, 1, 1, cols).setValues([
    ['公開予定日', 'タイトル', 'URL', 'キャスト', '', '', '', '', 'あらすじ', '画像URL', 'LINE新着通知', 'LINE公開直前通知', 'カレンダー登録']
  ]);
  range.setValues(allMovies);
}
