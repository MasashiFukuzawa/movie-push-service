# 概要
- [映画.com](https://eiga.com) から新着映画情報を取得し、LINEにプッシュ通知を送信するサービス
- LINE側から映画の詳細を見ることや、公開日をGoogleカレンダーへ登録することが可能  

![image](https://user-images.githubusercontent.com/44726460/65384623-44f43f00-dd5f-11e9-893f-2be755630637.png)

# 技術説明
## 使用技術・ツールなど
- Puppeteer
- Google Cloud Functions
- Google Apps Script（GAS）
- LINE API
- スプレッドシート（DBとして利用）

## LINEに通知されるまでの流れ
1. （GAS） Cloud Functions のエンドポイントを叩く
2. （Cloud Functions） Puppeteer を起動し、[映画.comの公開スケジュール](https://eiga.com/coming/) から最新の映画情報を取得
3. （Cloud Functions） スクレイピングの結果をJSONで返却
4. （GAS） JSONを整形してスプレッドシートに出力
5. （GAS） スプレッドシート中のデータを定期的にLINEに送信

## 機能要件
- 公開日が確定していない映画は通知しない（例：「2019年秋公開」のような表示のものがある）
- ホラー映画は通知しない
- 翌月公開の映画と公開1週間前の映画を通知する
- ユーザーは受けとった通知から各映画の詳細画面へ遷移が可能
- ユーザーは受けとった通知から映画の公開日をGoogleカレンダーに登録することが可能

## DB(スプレッドシート)の構造
- 公開予定日(string型)
- タイトル(string型)
- URL(string型)
- キャスト (5人)(string型)
- あらすじ(string型)
- 画像URL(string型)
- LINE新着通知フラグ(int型)
- LINE公開直前通知フラグ(int型)
- カレンダー登録フラグ(int型)

![image](https://user-images.githubusercontent.com/44726460/65421803-9ffd6300-de3f-11e9-821e-9c51cad43495.png)
