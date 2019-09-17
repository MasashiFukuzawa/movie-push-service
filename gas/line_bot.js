// LINE API
var ACCESS_TOKEN = '<YOUR LINE ACCESS TOKEN>';
var HEADERS      = {"Content-Type": "application/json", 'Authorization': 'Bearer ' + ACCESS_TOKEN};
var PUSH_URL     = "https://api.line.me/v2/bot/message/push";

// スプレッドシート
var ss              = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
var ws              = ss.getSheetByName('DB');
var lastRow         = ws.getDataRange().getLastRow();
var logSheet        = ss.getSheetByName('error_log');
var logSheetLastRow = logSheet.getDataRange().getLastRow();

// Gmail（エラー通知用）
var MY_GMAIL      = '<YOUR GMAIL ADDRESS>';
var LOG_SHEET_URL = '<YOUR LOG SHEET URL>';

// その他
var now = new Date();
var errorCount = 0;

function pushNewArrival() {
  const movies = getMovies(false);

  // 未通知の映画を全件送信する
  for (i = 0; i < movies.length; i++) {
    try {
      const postData = getPostData(movies[i], false);
      const options = {
        "method": "post",
        "headers": HEADERS,
        "payload": JSON.stringify(postData)
      };
      UrlFetchApp.fetch(PUSH_URL, options);
      // LINE通知ステータスを1に切り替える
      ws.getRange(movies[i]['row'], 11).setValue(1);
    } catch(error) {
      errorCount++;
      logSheet.getRange(logSheetLastRow + 1, 1).setValue(now.toLocaleString().slice(0, 18));
      logSheet.getRange(logSheetLastRow + 1, 2).setValue(movies[i]['title']);
      logSheet.getRange(logSheetLastRow + 1, 3).setValue(movies[i]['url']);
      logSheet.getRange(logSheetLastRow + 1, 4).setValue(error);
      // エラーの場合はLINE通知ステータスを2に切り替える
      ws.getRange(movies[i]['row'], 11).setValue(2);
    }
  }

  if (errorCount >= 1) {
    MailApp.sendEmail(MY_GMAIL, '[ERROR] 新着映画情報bot', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}

function pushReminder() {
  const movies = getMovies(true);

  // 未通知の映画を全件送信する
  for (i = 0; i < movies.length; i++) {
    try {
      const postData = getPostData(movies[i], true);
      const options = {
        "method": "post",
        "headers": HEADERS,
        "payload": JSON.stringify(postData)
      };
      UrlFetchApp.fetch(PUSH_URL, options);
    } catch(error) {
      logSheet.getRange(logSheetLastRow + 1, 1).setValue(now.toLocaleString().slice(0, 18));
      logSheet.getRange(logSheetLastRow + 1, 2).setValue(movies[i]['title']);
      logSheet.getRange(logSheetLastRow + 1, 3).setValue(movies[i]['url']);
      logSheet.getRange(logSheetLastRow + 1, 4).setValue(error);
      // エラーの場合はLINE通知ステータスを2に切り替える
      ws.getRange(movies[i]['row'], 11).setValue(2);
    }
  }

  if (errorCount >= 1) {
    MailApp.sendEmail(MY_GMAIL, '[ERROR] 新着映画情報bot', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}

function getMovies(reminderFlag) {
  // 全件取得
  const allMovies = ws.getRange(2, 1, lastRow, 11).getValues();

  var movies = [];
  for (i = 0; i < allMovies.length; i++) {
    var releaseDate = allMovies[i][0],
        pushStatus  = allMovies[i][10];

    // 公開予定日が決まっていない場合は次の映画へ
    var isReleaseDateFixed = Object.prototype.toString.call(releaseDate).slice(8, -1) === 'Date';
    if (!isReleaseDateFixed) {
      continue;
    }

    if (reminderFlag) {
      // 公開日の1週間前なら連想配列に追加
      var sevenDaysBeforeRelease = getSevenDaysBeforeRelease(releaseDate).toLocaleString().slice(0, 10);
      var today = now.toLocaleString().slice(0, 10);
      movies = sevenDaysBeforeRelease === today ? getMovieDict(movies, allMovies[i], i, releaseDate) : movies;
    } else {
      // LINE未通知なら連想配列に追加
      movies = pushStatus === 0 ? getMovieDict(movies, allMovies[i], i, releaseDate) : movies;
    }
  }

  // もし条件に合う映画がなければここで処理停止
  if (movies !== []) {
    return movies;
  } else {
    return false;
  }
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
  dict['description'] = movie[8];
  dict['imageUrl']    = movie[9];
  movies.push(dict);
  return movies;
}

function getPostData(movie, reminderFlag) {
  const USER_ID    = '<YOUR USER ID>';
  const dateString = movie['releaseDate'].toLocaleString().slice(5, 10);
  const title      = '【' + dateString + '公開】' + movie['title'];
  const text       = [movie['cast1'], movie['cast2'], movie['cast3'], movie['cast4'], movie['cast5']].join(' / ') + ' / etc...';

  var altText;
  if (reminderFlag) {
    altText = "公開直前の映画情報だよ！";
  } else {
    altText = "来月公開の映画情報だよ！";
  }

  const postData = {
    "to": USER_ID,
    "messages": [{
      "type": "template",
      "altText": altText,
      "template": {
        "type": "carousel",
        "columns": [{
          "thumbnailImageUrl": movie['imageUrl'],
          "imageBackgroundColor": '#0033cc',
          "title": title.slice(0, 39),  // LINE APIの文字数制限を考慮
          "text": text.slice(0, 59),    // LINE APIの文字数制限を考慮
          "actions": [
            {
              "type":"uri",
              "label":"詳細を見る",
              "uri": movie['url'],
            },
            {
              "type":"postback",
              "label": "カレンダーに登録する",
              "data": 'date=' + movie['releaseDate'].toLocaleString().slice(0, 10) + '&' + 'title=' + movie['title'],
              "displayText": "カレンダーに登録する",
            },
          ]
        }]
      }
    }]
  };
  return postData;
}

function getSevenDaysBeforeRelease(date) {
  date.setDate(date.getDate() - 7);
  return date;
}

// replyに対するアクション
function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const events = json["events"];

  for(var i = 0; i < events.length; i++){
    if(events[i].type == "message"){
      replyMessage(events[i]);
    } else if (events[i].type === "postback") {
      createEvents(events[i]);
      replyMessage(events[i]);
    }
  }
}

function createEvents(e) {
  const calender = CalendarApp.getCalendarById(MY_GMAIL);
  // dataは"date=2019/01/01&title=movie_title"という形式で渡されるため、5~14文字目を切り出せばに公開日が、22文字目以降を切り出せば映画タイトルが取得できる
  const data = e.postback.data;
  const date = new Date(data.slice(5, 15));
  const title = data.substr(22);
  calender.createAllDayEvent(title, date);
}

function replyMessage(e) {
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
  const postData = {
    "replyToken": e.replyToken,
    "messages": [{
        "type": "text",
        "text": e.type == "message" ? e.source.userId : "カレンダーに登録しました！",
      }]
  };
  const options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData),
  };
  UrlFetchApp.fetch(REPLY_URL, options);
}
