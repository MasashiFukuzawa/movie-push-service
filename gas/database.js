function cleanSpreadSheet() {
  const ss = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
  const ws = ss.getSheetByName('DB');
  const lastRow = ws.getLastRow();
  const lastCol = ws.getLastColumn();

  var allMovies = ws.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var movieNum  = allMovies.length;

  const movieTitles = allMovies.map(function(movie) {
    return movie[1]
  });

  for(var i　=　0;　i　<　movieNum;　i++){
    var date  = allMovies[i][0];
    var title = allMovies[i][1];

    // allMoviesのうち、A列がDate型でないものを配列から削除
    if (releaseDateNotFixed(date)) {
      allMovies.splice(i, 1);
      movieNum--;
      i--;
      continue;
    }

    // allMoviesの配列中に同titleがあれば削除
    if (duplicateDataPresent(allMovies, movieTitles, title, i)) {
      allMovies.splice(i, 1);
      movieNum--;
      i--;
    }
  }

  const rows  = allMovies.length;
  const cols  = allMovies[0].length;
  const range = ws.getRange(2, 1, rows, cols);

  // 一度シートを全消しした後、必要なデータだけを再度セットしていく
  ws.clearContents();
  ws.getRange(1, 1, 1, cols).setValues([['公開予定日', 'タイトル', 'URL', 'キャスト', '', '', '', '', 'あらすじ', '画像URL', 'LINE通知']]);
  range.setValues(allMovies);
}

function releaseDateNotFixed(date) {
  if(Object.prototype.toString.call(date).slice(8, -1) !== 'Date'){
    return true;
  }
  return false
}

function duplicateDataPresent(movies, titles, title, i) {
  const index = titles.indexOf(title);
  // 同一映画データを古い方から削除することで、imageUrlが取得できていなかったものについてアップデートが可能となる
  if (index !== i) {
    const oldLinePushStatus = movies[i][10];
    if (oldLinePushStatus === 1) {
      // 古いデータ削除する前に、古いデータのLINE通知フラグを新しい方の映画データに引き継がせておく必要がある
      // movies[index][10]はnewLinePushStatusを意味している
      movies[index][10] = oldLinePushStatus;
    }
    return true;
  }
  return false;
}
