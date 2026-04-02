# Vercel公開：コマンドを使った確実な手順

Vercel の画面上でアップロード場所が見つからない場合、以下の「コマンド」を使った方法が最も確実で簡単です。

## 手順：コマンド1つで公開する

1. **PowerShell を開く**
    * Windows のスタートメニューで 「PowerShell」 と入力して起動します。

2. **フォルダに移動する**
    * 以下のコマンドをコピーして PowerShell に貼り付け、Enterキーを押してください。

    ```powershell
    cd "c:\Users\M-HAYASHI\Desktop\点検表管理"
    ```

3. **Vercel にログインする**
    * 以下のコマンドを入力し、Enterキーを押します。

    ```powershell
    npx vercel login
    ```

    * 「Continue with GitHub」などの選択肢が出るので、矢印キーで選んでログインを完了させてください。

4. **公開（デプロイ）を実行する**
    * ログイン完了後、以下のコマンドを入力します。

    ```powershell
    npx vercel --prod
    ```

    * いくつか質問が出ますが、すべて **「Enterキー」** を押すだけで大丈夫です。
        * `Set up and deploy?` → Enter
        * `Which scope?` → Enter
        * `Link to existing project?` → Enter (N)
        * `What's your project's name?` → Enter
        * `In which directory?` → Enter
        * `Want to modify settings?` → Enter (N)

5. **完了！**
    * 画面に `Production: https://tenken-manage...vercel.app` と表示されます。
    * この URL をコピーして、LINE Developers の **「エンドポイントURL」** に貼り付けてください。

---

> [!NOTE]
> もしコマンドがうまくいかない場合は、Vercel のダッシュボードに戻り、**「Import Third-Party Git Repository」** というようなボタンがないか、あるいはブラウザの画面自体にフォルダを放り込んでみてください（最近の Vercel はログイン直後のトップ画面全体がドロップゾーンになっていることがあります）。
