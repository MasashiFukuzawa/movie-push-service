function outputMovies() {
  try {
    const response = UrlFetchApp.fetch(ENDPOINT).getContentText();
    const movies = JSON.parse(response);
    const values = movies.map(function (movie) {
      return Object.keys(movie).map(function (key) {
        return movie[key];
      });
    });

    const range = ws.getRange(lastRow + 1, 1, values.length, values[0].length);
    range.setValues(values);

  } catch(error) {
    const errorDate = new Date();
    logSheet.getRange(logSheetLastRow + 1, 1).setValue(errorDate.toLocaleString().slice(0, 18));
    logSheet.getRange(logSheetLastRow + 1, 2).setValue('CloudFunctions');
    logSheet.getRange(logSheetLastRow + 1, 3).setValue(error);
    MailApp.sendEmail(MY_GMAIL, '[ERROR] CloudFunctions', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}
