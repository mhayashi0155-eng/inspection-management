# Vercel公開とLINE LIFF連携の最終設定手順

作成した点検アプリをインターネットに公開し、LINEからアクセスできるようにするための全手順です。

## ステップ1：Vercel でアプリを公開する

1. [Vercel](https://vercel.com/) にアクセスし、アカウントをお持ちでない場合は GitHub や Google アカウントでサインアップします。
2. ダッシュボードが表示されたら、現在デスクトップにある「点検表管理」フォルダをご用意ください。
3. Vercel の **"Add New"** → **"Project"** を選択します。
4. 「Import Git Repository」ではなく、下の方にある **"Other"** セクション、または画面上の **「Upload」** エリアに、**「点検表管理」フォルダを丸ごとドラッグ＆ドロップ**します。
5. Project Name などはデフォルトのままで **"Deploy"** をクリックします。
6. 数秒でデプロイが完了し、`https://your-project-name.vercel.app` のような URL が発行されます。この URL をコピーしておいてください。

---

## ステップ2：LINE Developers の設定を更新する

1. [LINE Developers コンソール](https://developers.line.biz/console/) にログインします。
2. 作成した「LINEログイン」チャネルを選択し、**「LIFF」** タブを開きます。
3. 作成済みの LIFF アプリを選択し、以下の項目を編集します。
    * **エンドポイントURL**: ステップ1で発行された Vercel の URL を貼り付けます。
        * 例: `https://tenken-manage.vercel.app/`
    * **スコープ (Scopes)**: `profile` と `openid` にチェックが入っていることを確認します。
4. 保存（Update）をクリックします。

---

## ステップ3：Supabase の設定を確認する (SQL実行)

すでに `database_schema.sql` を実行済みの場合は不要ですが、まだの場合は以下を行ってください。

1. [Supabase ダッシュボード](https://supabase.com/dashboard/) を開きます。
2. **"SQL Editor"** を開き、`database_schema.sql` の内容をすべて貼り付けて、**"Run"** をクリックします。

---

## ステップ4：動作確認

1. LINE アプリで、LIFF URL（`https://miniapp.line.me/2008902635-5DQbjvmz`）を開きます。
2. 初回のみ「許可」の画面が出るので同意してください。
3. 点検データを入力し、「保存」ボタンを押します。
4. LINE 内のブラウザが自動で閉じれば成功です！
5. PC で Vercel の URL（またはローカルの `index.html`）を開き、データが届いているか確認してください。

> [!IMPORTANT]
> **デバッグのヒント**
> もし動かない場合は、Vercel にアップロードした `script.js` 内の `SUPABASE_URL` や `SUPABASE_KEY` が正しいか再度ご確認ください。これらは、今回の開発中に最新の状態に更新してあります。
