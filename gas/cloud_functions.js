function outputMovies() {
  const ENDPOINT = '<YOUR CLOUD FUNCTIONS ENDPOINT>';

  const ss = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
  const ws = ss.getSheetByName('DB');
  const lastRow = ws.getDataRange().getLastRow();

  try {
    const response = UrlFetchApp.fetch(ENDPOINT).getContentText();
    const movies = JSON.parse(response);
    const values = movies.map(function (article) {
      return Object.keys(article).map(function (key) {
        return article[key];
      });
    });

    const range = ws.getRange(lastRow + 1, 1, values.length, values[0].length);
    range.setValues(values);

  } catch(error) {
    const logSheet = ss.getSheetByName('error_log');
    const logSheetLastRow = logSheet.getDataRange().getLastRow();
    const errorDate = new Date();
    const isErrorPresent = true;
    logSheet.getRange(logSheetLastRow + 1, 1).setValue(errorDate.toLocaleString().slice(0, 18));
    logSheet.getRange(logSheetLastRow + 1, 4).setValue('Puppeteer/CloudFunctions: ' + error);
  }

  if (isErrorPresent) {
    const MY_GMAIL = '<YOUR GMAIL ADDRESS>';
    const LOG_SHEET_URL = '<YOUR SPREAD SHEET URL FOR LOGS>';
    MailApp.sendEmail(MY_GMAIL, '[ERROR] Puppeteer/CloudFunctions', '下記URLからエラー内容を確認し、対応して下さい。' + '\n' + LOG_SHEET_URL);
  }
}
