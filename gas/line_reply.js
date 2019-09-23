function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const events = json['events'];

  for(var i = 0; i < events.length; i++){
    if(events[i].type === 'message'){
      _respondToMsg(events[i]);
    } else if (events[i].type === 'postback') {
      _createEvents(events[i]);
    }
  }
}

// 以下、プライベートメソッド

function _respondToMsg(event) {
  const msg = event.message.text;

  switch (msg) {
    case 'id':
      _replyMessage(event, event.source.userId);
      break;
    case '今すぐ見る':
      pushNewArrival();
      break;
    case 'また明日':
      _replyMessage(event, 'おっけー！また明日送るね！');
      break;
    case '確認する':
      pushReminder();
      break;
    case 'また後で':
      _replyMessage(event, 'おっけー！また後で押してね！');
      break;
  }
}

function _createEvents(event) {
  const calender = CalendarApp.getCalendarById(MY_GMAIL);
  // dataは"date=2019/01/01&title=movie_title"という形式で渡されるため、5~14文字目を切り出せばに公開日が、22文字目以降を切り出せば映画タイトルが取得できる
  const data = event.postback.data;
  const date = new Date(data.slice(5, 15));
  const title = data.substr(22);
  calender.createAllDayEvent(title, date);

  // スプレッドシートから同一タイトルを検索
  const index = _getIndexOfSameTitle(title);
  // スプレッドシートL列にあるカレンダー登録フラグを立てる
  ws.getRange(index + 2, 13).setValue(1);
  // カレンダー登録が成功した旨を通知
  const text = '【' + date.toLocaleString().slice(5, 10) + '公開】' + title + ' をカレンダーに登録しました！';
  _replyMessage(event, text);
}

function _replyMessage(event, text) {
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

function _getIndexOfSameTitle(title) {
  const titles = allMovies.map(function(movie) {
    return movie[1]
  });
  const index = titles.indexOf(title);
  return index;
}
