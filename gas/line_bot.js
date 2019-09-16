// LINE API
var ACCESS_TOKEN = '<YOUR LINE ACCESS TOKEN>';
var HEADERS = {"Content-Type": "application/json", 'Authorization': 'Bearer ' + ACCESS_TOKEN};

// Gmail（エラー通知用）
var TO = '<YOUR GMAIL ADDRESS>';
var LOG_SHEET_URL = '<YOUR LOG SHEET URL>';

function pushMessages() {
  const URL = "https://api.line.me/v2/bot/message/push";

  var ss = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
  var ws = ss.getSheetByName('DB');
  var lastRow = ws.getDataRange().getLastRow();

  var errorCount = 0;

  var movies = getMovies(ws, lastRow);

  // 未通知の映画を全件送信する
  for (i = 0; i < movies.length; i++) {
    try {
      var postData = getPostData(movies[i]);
      var options = {
        "method": "post",
        "headers": HEADERS,
        "payload": JSON.stringify(postData)
      };
      UrlFetchApp.fetch(URL, options);
      // LINE通知ステータスを1に切り替える
      ws.getRange(movies[i]['row'], 11).setValue(1);
    } catch(error) {
      var logSheet = ss.getSheetByName('error_log');
      var logSheetLastRow = logSheet.getDataRange().getLastRow();
      var errorDate = new Date();
      errorCount++;
      logSheet.getRange(logSheetLastRow + 1, 1).setValue(errorDate.toLocaleString().slice(0, 18));
      logSheet.getRange(logSheetLastRow + 1, 2).setValue(movies[i]['title']);
      logSheet.getRange(logSheetLastRow + 1, 3).setValue(movies[i]['url']);
      logSheet.getRange(logSheetLastRow + 1, 4).setValue(error);
      // エラーの場合はLINE通知ステータスを2に切り替える
      ws.getRange(movies[i]['row'], 11).setValue(2);
    }
  }

  if (errorCount >= 1) {
    MailApp.sendEmail(TO, '[ERROR] 新着映画情報bot', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}

function getMovies(ws, lastRow) {
  // 全件取得
  var allMovies = ws.getRange(1, 1, lastRow, 11).getValues();

  // 公開予定日が決まっている && LINE未通知の映画を配列に詰め込んでいく
  var movies = [];
  for (i = 0; i < allMovies.length; i++) {
    var row = i + 1; // 最後にLINE通知ステータスを切り替える際に使用

    var releaseDate = allMovies[i][0];
    var title       = allMovies[i][1];
    var url         = allMovies[i][2];
    var cast1       = allMovies[i][3];
    var cast2       = allMovies[i][4];
    var cast3       = allMovies[i][5];
    var cast4       = allMovies[i][6];
    var cast5       = allMovies[i][7];
    var description = allMovies[i][8];
    var imageUrl    = allMovies[i][9];
    var pushStatus  = allMovies[i][10];

    // 公開予定日が決まっている && LINE未通知なら連想配列に追加
    if (Object.prototype.toString.call(releaseDate).slice(8, -1) === 'Date' && pushStatus === 0) {
      var dict = {};
      dict['row']         = row;
      dict['releaseDate'] = releaseDate;
      dict['title']       = title;
      dict['url']         = url;
      dict['cast1']       = cast1;
      dict['cast2']       = cast2;
      dict['cast3']       = cast3;
      dict['cast4']       = cast4;
      dict['cast5']       = cast5;
      dict['description'] = description;
      dict['imageUrl']    = imageUrl;
      movies.push(dict);
    }
  }

  // もし条件に合う映画がなければここで処理停止
  if (movies !== []) {
    return movies;
  } else {
    return false;
  }
}

function getPostData(movie) {
  const USER_ID = 'YOUR USER ID';

  var dateString = movie['releaseDate'].toLocaleString().slice(5, 10);
  var title      = '【' + dateString + '公開】' + movie['title'];
  var text       = [movie['cast1'], movie['cast2'], movie['cast3'], movie['cast4'], movie['cast5']].join(' / ') + ' / etc...';

  var postData = {
    "to": USER_ID,
    "messages": [{
      "type": "template",
      "altText": "新着映画情報だよ！",
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
              "label":"カレンダーに登録する",
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

// replyに対するアクション
function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  var events = json["events"];

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
  var calender = CalendarApp.getCalendarById('<YOUR CALENDER ID>');
  // dataは"date=2019/01/01&title=movie_title"という形式で渡されるため、5~14文字目を切り出せばに公開日が、22文字目以降を切り出せば映画タイトルが取得できる
  var data = e.postback.data;
  var date = new Date(data.slice(5, 15));
  var title = data.substr(22);
  calender.createAllDayEvent(title, date);
}

function replyMessage(e) {
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
  var postData = {
    "replyToken": e.replyToken,
    "messages": [{
        "type": "text",
        "text": e.type == "message" ? e.source.userId : "カレンダーに登録しました！",
      }]
  };
  var options = {
    "method": "post",
    "headers": HEADERS,
    "payload": JSON.stringify(postData),
  };
  UrlFetchApp.fetch(REPLY_URL, options);
}
