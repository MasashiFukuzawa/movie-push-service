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

## LINEに通知されるまでの流れと機能要件
1. （GAS） Cloud Functions のエンドポイントを叩く
2. （Cloud Functions） Puppeteer を起動し、[映画.comの公開スケジュール](https://eiga.com/coming/） から最新の映画情報を取得
3. （Cloud Functions） スクレイピングの結果をJSONで返却
4. （GAS） JSONを整形してスプレッドシートに出力
5. (GAS) スプレッドシート中のデータを定期的にLINEに送信
6. 通知を受けとったユーザーは各映画の詳細画面へ遷移したり、映画の公開日をGoogleカレンダーに登録することが可能

## その他要件
- 公開日が確定していない映画は通知しない（例：「2019年秋公開」のような表示のものがある）
- ホラー映画は通知しない
- 翌月公開の映画と公開1週間前の映画を通知

## 今後追加する可能性のある機能
- 検索機能
- お気に入り機能
- レコメンド機能
