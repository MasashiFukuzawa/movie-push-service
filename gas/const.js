// 全ファイル共通の変数・定数を集約

// LINE API
var ACCESS_TOKEN = '<YOUR ACCESS_TOKEN>';
var HEADERS      = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ACCESS_TOKEN};
var PUSH_URL     = 'https://api.line.me/v2/bot/message/push';
var REPLY_URL    = 'https://api.line.me/v2/bot/message/reply';
var USER_ID      = '<YOUR USER ID>';

// スプレッドシート
var ss        = SpreadsheetApp.openById('<YOUR SPREAD SHEET ID>');
var ws        = ss.getSheetByName('DB');
var lastRow   = ws.getLastRow();
var lastCol   = ws.getLastColumn();
var allMovies = ws.getRange(2, 1, lastRow, lastCol).getValues();

// CloudFunctions
var ENDPOINT = '<YOUR CLOUD FUNCTIONS ENDPOINT>';

// エラーログ関連
var logSheet        = ss.getSheetByName('error_log');
var logSheetLastRow = logSheet.getLastRow();
var LOG_SHEET_URL   = '<YOUR LOG SHEET URL>';
var MY_GMAIL        = '<YOUR GMAIL ADDRESS>'; // Googleカレンダー登録時にも利用
