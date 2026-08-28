【抽選管理アプリ：アプリアイコン設定済み構成】

このZIPは、カレンダーから直接予定名をタップして詳細へ遷移せず、
「その日の予定」の「詳細を見る」ボタンから詳細画面へ移動する最新版をベースに、
PWA用のアプリアイコン設定を追加したものです。

構成：
index.html
style.css
app.js
manifest.json
icon/
  icon-192.png
  icon-512.png
  icon-180.png
  icon-152.png
  icon-72.png

GitHub Pagesへそのまま配置できます。

index.htmlには以下を設定済みです。
- manifest.json
- favicon（192x192）
- Apple Touch Icon（180x180）

manifest.jsonにはホーム画面用の192x192 / 512x512を設定済みです。
