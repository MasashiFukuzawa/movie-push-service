function pushNewArrival() {
  const tmp = _getMovies(false);
  const movies = tmp['movies'];
  const moreMoviesExist = tmp['bool'];

  // 通知対象の映画がなければここで処理停止
  if (movies.length < 1) {
    return;
  }

  try {
    // 未通知の映画を10件送信する
    UrlFetchApp.fetch(PUSH_URL, _getPostOptions(movies, false));

    // LINE新着通知ステータスを1に切り替える
    _updateLinePushStatus(movies, 10, 1);

    // 他にも通知可能な映画があればもっと見るかのメッセージを送信
    if (moreMoviesExist) {
      _notifyMoreMoviesExit(false);
    }

  } catch(error) {
    _outputErrorLogs(error, movies, 'LINE新着通知', 10, 'LINEプッシュ通知');
  }
}

// NOTE: 基本的にpushNewArrival関数と同様の処理だが、
// GASの定期実行の仕様上、引数を指定できないので新着用とリマインド用にメソッドを2つ用意
function pushReminder() {
  const tmp = _getMovies(true);
  const movies = tmp['movies'];
  const moreMoviesExist = tmp['bool'];

  // 通知対象の映画がなければここで処理停止
  if (movies.length < 1) {
    return;
  }

  try {
    UrlFetchApp.fetch(PUSH_URL, _getPostOptions(movies, true));

    _updateLinePushStatus(movies, 11, 1);

    if (moreMoviesExist) {
      _notifyMoreMoviesExit(true);
    }

  } catch(error) {
    _outputErrorLogs(error, movies, 'LINE公開直前通知', 11, 'LINEリマインダー通知');
  }
}

// 以下、プライベートメソッド
//--------------------------------------------------------------------------------------

function _getPostOptions(movies, reminderFlag) {
  const postData = _getPostData(movies, false);
  const options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData)
  };
  return options;
}

function _updateLinePushStatus(movies, col, value) {
  for (var i = 0; i < movies.length; i++) {
    ws.getRange(movies[i]['row'], col).setValue(value);
  }
}

function _notifyMoreMoviesExit(reminderFlag) {
  const altText         = _getTexts(reminderFlag)['altText'];
  const msgText         = _getTexts(reminderFlag)['msgText'];
  const actionTextLeft  = _getTexts(reminderFlag)['actionTextLeft'];
  const actionTextRight = _getTexts(reminderFlag)['actionTextRight'];

  const postData = {
    "to": USER_ID,
    "messages": [{
      "type": "template",
      "altText": altText,
      "template": {
        "type": "confirm",
        "text": msgText + "もっと見たい？",
        "actions": [
          {
            "type": "message",
            "label": actionTextLeft,
            "text": actionTextLeft,
          },
          {
            "type": "message",
            "label": actionTextRight,
            "text": actionTextRight,
          }
        ],
      }
    }]
  };

  const options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData)
  };

  UrlFetchApp.fetch(PUSH_URL, options);
}

function _getTexts(reminderFlag) {
  var altText;
  var msgText;
  var actionTextLeft;
  var actionTextRight;

  if (reminderFlag) {
    altText         = '公開直前の映画情報だよ！';
    msgText         = '公開1週間前の映画は他にもあるよ！';
    actionTextLeft  = '確認する';
    actionTextRight = 'また後で';
  } else {
    altText         = '来月公開の映画情報だよ！';
    msgText         = '来月公開の映画は他にもあるよ！';
    actionTextLeft  = '今すぐ見る';
    actionTextRight = 'また明日';

  }
  const texts = {
    altText: altText,
    msgText: msgText,
    actionTextLeft: actionTextLeft,
    actionTextRight: actionTextRight
  };
  return texts;
}

function _outputErrorLogs(error, movies, logTitle, statusRow, mailSubject) {
  logSheet.getRange(logSheetLastRow + 1, 1).setValue(new Date().toLocaleString().slice(0, 18));
  logSheet.getRange(logSheetLastRow + 1, 2).setValue(logTitle);
  logSheet.getRange(logSheetLastRow + 1, 3).setValue(error);
  _updateLinePushStatus(movies, statusRow, 2)
  MailApp.sendEmail(MY_GMAIL, '[ERROR] ' + mailSubject, '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
}

function _getMovies(reminderFlag) {
  var moreMoviesExist = false;

  var movies = [];
  for (var i = 0; i < allMovies.length; i++) {
    var movie = allMovies[i];
    var releaseDate = movie[0];

    // 公開予定日が決まっていない場合は次の映画へ
    var isReleaseDateFixed = Object.prototype.toString.call(releaseDate).slice(8, -1) === 'Date';
    if (!isReleaseDateFixed) {
      continue;
    }

    var pushStatus;
    if (reminderFlag) {
      // 公開日の1週間前なら連想配列に追加
      var sevenDaysBeforeRelease = _getSevenDaysBeforeRelease(releaseDate).toLocaleString().slice(0, 10);
      var today = new Date().toLocaleString().slice(0, 10);
      pushStatus = movie[10];
      movies = sevenDaysBeforeRelease === today && pushStatus === 0 ? _getMovieDict(movies, movie, i, releaseDate) : movies;
    } else {
      // LINE未通知なら連想配列に追加
      pushStatus = movie[9];
      movies = pushStatus === 0 ? _getMovieDict(movies, movie, i, releaseDate) : movies;
    }

    // NOTE: LINE APIのカルーセル表示は1回につき最大10件までなので、1度の処理に全データを入れる必要はない
    if (movies.length > 10) {
      moreMoviesExist = true;
      movies.pop();
      break;
    }
  }
  return {movies: movies, bool: moreMoviesExist};
}

function _getMovieDict(movies, movie, i, releaseDate) {
  var dict = {};
  dict['row']         = i + 2; // 最後にLINE通知ステータスを切り替える際に使用
  dict['releaseDate'] = releaseDate;
  dict['title']       = movie[1];
  dict['url']         = movie[2];
  dict['cast1']       = movie[3];
  dict['cast2']       = movie[4];
  dict['cast3']       = movie[5];
  dict['cast4']       = movie[6];
  dict['cast5']       = movie[7];
  dict['imageUrl']    = movie[8];
  movies.push(dict);
  return movies;
}

function _getPostData(movies, reminderFlag) {
  const altText  = _getTexts(reminderFlag)['altText'];
  const columns  = _getColumns(movies);
  const postData = {
    "to": USER_ID,
    "messages": [{
      "type": "template",
      "altText": altText,
      "template": {
        "type": "carousel",
        "columns": columns,
      }
    }]
  };
  return postData;
}

function _getColumns(movies) {
  var columns = [];
  for (var i = 0; i < movies.length; i++) {
    var movie      = movies[i];
    var date       = movie['releaseDate'];
    var dateString = date.toLocaleString().slice(5, 10);
    var movieTitle = movie['title'];
    var lineTitle  = '【' + dateString + '公開】' + movieTitle;
    var text       = [movie['cast1'], movie['cast2'], movie['cast3'], movie['cast4'], movie['cast5']].join(' / ') + ' / etc...';

    var column = {
      "thumbnailImageUrl": movie['imageUrl'],
      "imageBackgroundColor": "#0033cc",
      "title": lineTitle.slice(0, 39), // LINE APIの文字数制限を考慮
      "text": text.slice(0, 59),       // LINE APIの文字数制限を考慮
      "actions": [
        {
          "type":"uri",
          "label":"詳細を見る",
          "uri": movie['url'],
        },
        {
          "type":"postback",
          "label": "カレンダーに登録する",
          "data": "date=" + date.toLocaleString().slice(0, 10) + "&" + "title=" + movieTitle,
        },
      ]
    };
    columns.push(column);
  }
  return columns;
}

function _getSevenDaysBeforeRelease(date) {
  date.setDate(date.getDate() - 7);
  return date;
}
