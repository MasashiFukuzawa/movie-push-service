// 定数（constにしたかったが、constではエラーが出たためvarで宣言している）
//--------------------------------------------------------------------------------------
// LINE API
var ACCESS_TOKEN = '<YOUR LINE ACCESS TOKEN>';
var HEADERS      = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ACCESS_TOKEN};
var PUSH_URL     = 'https://api.line.me/v2/bot/message/push';
var REPLY_URL    = 'https://api.line.me/v2/bot/message/reply';
var USER_ID      = '<YOUR USER ID>';

// スプレッドシート
var ss      = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
var ws      = ss.getSheetByName('DB');
var lastRow = ws.getLastRow();
var lastCol = ws.getLastColumn();

// その他
var MY_GMAIL = '<YOUR GMAIL ADDRESS>';
var now      = new Date();
//--------------------------------------------------------------------------------------

// 定期通知
//--------------------------------------------------------------------------------------
function pushNewArrival() {
  const tmp = getMovies(false);
  const movies = tmp['movies'];
  const moreMoviesExist = tmp['bool'];

  // 通知対象の映画がなければここで処理停止
  if (movies.length < 1) {
    return;
  }

  try {
    // 未通知の映画を10件送信する
    UrlFetchApp.fetch(PUSH_URL, getPostOptions(movies, false));

    // LINE新着通知ステータスを1に切り替える
    updateLinePushStatus(movies, 10, 1);

    // 他にも通知可能な映画があればもっと見るかのメッセージを送信
    if (moreMoviesExist) {
      notifyMoreMoviesExit(false);
    }

  } catch(error) {
    outputErrorLogs(error, movies, 'LINE新着通知', 10, 'LINEプッシュ通知');
  }
}

// NOTE: 基本的にpushNewArrival関数と同様の処理だが、
// GASの定期実行の仕様上、引数を指定できないので新着用とリマインド用にメソッドを2つ用意
function pushReminder() {
  const tmp = getMovies(true);
  const movies = tmp['movies'];
  const moreMoviesExist = tmp['bool'];

  // 通知対象の映画がなければここで処理停止
  if (movies.length < 1) {
    return;
  }

  try {
    UrlFetchApp.fetch(PUSH_URL, getPostOptions(movies, true));

    updateLinePushStatus(movies, 11, 1);

    if (moreMoviesExist) {
      notifyMoreMoviesExit(true);
    }

  } catch(error) {
    outputErrorLogs(error, movies, 'LINE公開直前通知', 11, 'LINEリマインダー通知');
  }
}

function getPostOptions(movies, reminderFlag) {
  const postData = getPostData(movies, false);
  const options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData)
  };
  return options;
}
//--------------------------------------------------------------------------------------

// プライベートメソッド
//--------------------------------------------------------------------------------------
function updateLinePushStatus(movies, col, value) {
  for (var i = 0; i < movies.length; i++) {
    ws.getRange(movies[i]['row'], col).setValue(value);
  }
}

function notifyMoreMoviesExit(reminderFlag) {
  const altText         = getTexts(reminderFlag)['altText'];
  const msgText         = getTexts(reminderFlag)['msgText'];
  const actionTextLeft  = getTexts(reminderFlag)['actionTextLeft'];
  const actionTextRight = getTexts(reminderFlag)['actionTextRight'];

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

function getTexts(reminderFlag) {
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
  return {altText: altText, msgText: msgText, actionTextLeft: actionTextLeft, actionTextRight: actionTextRight};
}

function outputErrorLogs(error, movies, logTitle, statusRow, mailSubject) {
  const logSheet        = ss.getSheetByName('error_log');
  const logSheetLastRow = logSheet.getLastRow();
  const LOG_SHEET_URL   = '<YOUR LOG SHEET URL>';

  logSheet.getRange(logSheetLastRow + 1, 1).setValue(now.toLocaleString().slice(0, 18));
  logSheet.getRange(logSheetLastRow + 1, 2).setValue(logTitle);
  logSheet.getRange(logSheetLastRow + 1, 3).setValue(error);
  updateLinePushStatus(movies, statusRow, 2)
  MailApp.sendEmail(MY_GMAIL, '[ERROR] ' + mailSubject, '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
}

function getMovies(reminderFlag) {
  // 全件取得
  const allMovies = ws.getRange(2, 1, lastRow, lastCol).getValues();

  var moreMoviesExist = false;

  var movies = [];
  for (var i = 0; i < allMovies.length; i++) {
    var releaseDate = allMovies[i][0];

    // 公開予定日が決まっていない場合は次の映画へ
    var isReleaseDateFixed = Object.prototype.toString.call(releaseDate).slice(8, -1) === 'Date';
    if (!isReleaseDateFixed) {
      continue;
    }

    var pushStatus;
    if (reminderFlag) {
      // 公開日の1週間前なら連想配列に追加
      var sevenDaysBeforeRelease = getSevenDaysBeforeRelease(releaseDate).toLocaleString().slice(0, 10);
      var today = now.toLocaleString().slice(0, 10);
      pushStatus = allMovies[i][10];
      movies = sevenDaysBeforeRelease === today && pushStatus === 0 ? getMovieDict(movies, allMovies[i], i, releaseDate) : movies;
    } else {
      // LINE未通知なら連想配列に追加
      pushStatus = allMovies[i][9];
      movies = pushStatus === 0 ? getMovieDict(movies, allMovies[i], i, releaseDate) : movies;
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

function getMovieDict(movies, movie, i, releaseDate) {
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

function getPostData(movies, reminderFlag) {
  const altText  = getTexts(reminderFlag)['altText'];
  const columns  = getColumns(movies);
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

function getColumns(movies) {
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

function getSevenDaysBeforeRelease(date) {
  date.setDate(date.getDate() - 7);
  return date;
}
//--------------------------------------------------------------------------------------

// replyアクション
//--------------------------------------------------------------------------------------
function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const events = json['events'];

  for(var i = 0; i < events.length; i++){
    if(events[i].type === 'message'){
      respondToMsg(events[i]);
    } else if (events[i].type === 'postback') {
      createEvents(events[i]);
    }
  }
}

function createEvents(event) {
  const calender = CalendarApp.getCalendarById(MY_GMAIL);
  // dataは"date=2019/01/01&title=movie_title"という形式で渡されるため、5~14文字目を切り出せばに公開日が、22文字目以降を切り出せば映画タイトルが取得できる
  const data = event.postback.data;
  const date = new Date(data.slice(5, 15));
  const title = data.substr(22);
  calender.createAllDayEvent(title, date);

  // スプレッドシートから同一タイトルを検索
  const index = getIndexOfSameTitle(title);
  // スプレッドシートL列にあるカレンダー登録フラグを立てる
  ws.getRange(index + 2, 12).setValue(1);
  // カレンダー登録が成功した旨を通知
  const text = "【" + date.toLocaleString().slice(5, 10) + "公開】" + title + " をカレンダーに登録しました！";
  replyMessage(event, text);
}

function getIndexOfSameTitle(title) {
  const allMovies = ws.getRange(2, 1, lastRow, lastCol).getValues();
  const titles = allMovies.map(function(movie) {
    return movie[1]
  });
  const index = titles.indexOf(title);
  return index;
}

function respondToMsg(event) {
  const msg = event.message.text;

  switch (msg) {
    case 'id':
      replyMessage(event, event.source.userId);
      break;
    case '今すぐ見る':
      pushNewArrival();
      break;
    case 'また明日':
      replyMessage(event, 'おっけー！また明日送るね！');
      break;
    case '確認する':
      pushReminder();
      break;
    case 'また後で':
      replyMessage(event, 'おっけー！また後で押してね！');
      break;
    // 後々ここに検索用のロジックを追加する
  }
}

function replyMessage(event, text) {
  const postData = {
    "replyToken": event.replyToken,
    "messages": [{
      "type": "text",
      "text": text,
    }]
  };

  const options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData),
  };

  UrlFetchApp.fetch(REPLY_URL, options)
}
//--------------------------------------------------------------------------------------
