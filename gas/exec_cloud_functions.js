var URL = 'CLOUD FUNCTIONS ENDPOINT';

function outputMovies() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var response = UrlFetchApp.fetch(URL).getContentText();
  var movies = JSON.parse(response);
  var values = movies.map(function (article) {
    return Object.keys(article).map(function (key) {
      return article[key];
    });
  });

  var range = sheet.getRange(1, 1, values.length, values[0].length);
  range.setValues(values);
}