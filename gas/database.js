function cleanSpreadSheet() {
  const ss = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
  const ws = ss.getSheetByName('DB');
  const lastRow = ws.getDataRange().getLastRow();
  const nextYearMonth = getNextYearMonth();

  var nextMonthMovies = [];
  for(var i　=　2;　i　<=　lastRow ;　i++){
    var date = ws.getRange(i, 1).getValue();
    var dateString = date.toLocaleString().slice(0, 10);

    deleteReleaseDateNotFixed(ws, i, date);

    var title = getMovieTitle(ws, i, nextYearMonth, dateString);

    if (title) {
      deleteDuplicateDatas(ws, i, nextMonthMovies, title);
      nextMonthMovies.push(title);
    }
  }
}

function getNextYearMonth() {
  const now = new Date();
  const year  = now.getFullYear(),
        month = now.getMonth();

  var nextYearMonth; // nextYearMonthは"2019/01"のようなString型
  if (month === 12) {
    nextYearMonth = (year + 1) + '/01';
  } else {
    nextYearMonth = year + '/' + ("0" + (month + 2)).slice(-2);
  }
  return nextYearMonth;
}

function deleteReleaseDateNotFixed(ws, i, date) {
  // A列がDate型でないものを削除
  if(Object.prototype.toString.call(date).slice(8, -1) !== 'Date'){
    ws.deleteRows(i);
  }
}

function getMovieTitle(ws, i, nextYearMonth, dateString) {
  var regexp = new RegExp('^' + nextYearMonth);
  // 来月公開の映画であればタイトルを取得
  if (regexp.test(dateString)) {
    var title = ws.getRange(i, 2).getValue();
    return title;
  } else {
    return false;
  }
}

function deleteDuplicateDatas(ws, i, nextMonthMovies, title) {
  // nextMonthMoviesの配列中に同titleがあれば削除
  if (nextMonthMovies.indexOf(title) !== -1) {
    ws.deleteRows(i);
  }
}
