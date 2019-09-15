function outputMovies() {
  const ENDPOINT = '<YOUR CLOUD FUNCTIONS ENDPOINT>';

  var ss = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
  var ws = ss.getSheetByName('DB');
  var lastRow = ws.getDataRange().getLastRow();

  try {
    var response = UrlFetchApp.fetch(ENDPOINT).getContentText();
    var movies = JSON.parse(response);
    var values = movies.map(function (article) {
      return Object.keys(article).map(function (key) {
        return article[key];
      });
    });

    var range = ws.getRange(lastRow + 1, 1, values.length, values[0].length);
    range.setValues(values);

  } catch(error) {
    var logSheet = ss.getSheetByName('error_log');
    var logSheetLastRow = logSheet.getDataRange().getLastRow();
    var errorDate = new Date();
    var isErrorPresent = true;
    logSheet.getRange(logSheetLastRow + 1, 1).setValue(errorDate.toLocaleString().slice(0, 18));
    logSheet.getRange(logSheetLastRow + 1, 4).setValue('Puppeteer/CloudFunctions: ' + error);
  }

  if (isErrorPresent) {
    const TO = '<YOUR GMAIL ADDRESS>';
    const LOG_SHEET_URL = '<YOUR SPREAD SHEET URL FOR LOGS>';
    MailApp.sendEmail(TO, '[ERROR] Puppeteer/CloudFunctions', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}