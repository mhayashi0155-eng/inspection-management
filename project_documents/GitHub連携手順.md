# GitHub連携・アップロード手順

この手順では、作成したローカルのGitリポジトリをGitHubにアップロード（プッシュ）する方法を説明します。

## 事前準備

GitHubのアカウントをお持ちでない場合は、[GitHub公式サイト](https://github.com/)で作成してください。

## Step 1: GitHubでリポジトリを作成する

1. GitHubにログインし、右上の「+」アイコンから **[New repository]** を選択します。
2. **Repository name** に `inspection-management`（またはお好みの名前）を入力します。
3. 公開設定を選びます：
   - **Public**: 誰でも見ることができます。
   - **Private**: あなたと許可した人のみ見ることができます。
4. **[Create repository]** ボタンをクリックします。

## Step 2: 連携コマンドを実行する

リポジトリ作成後、表示される画面の「…or push an existing repository from the command line」というセクションにあるコマンドをコピーして実行します。
（通常は以下のようなコマンドです）

```bash
# 1. リモートを追加（URL部分はご自身のものに置き換えてください）
git remote add origin https://github.com/あなたのユーザー名/inspection-management.git

# 2. メインブランチの名前を「main」に変更
git branch -M main

# 3. アップロード
git push -u origin main
```

## Step 3: 完了確認

GitHubのページを更新して、ファイルが表示されていれば成功です！

---
> [!TIP]
> **VS Codeを使っている場合**:
> 左側の「ソース管理」アイコン（枝分かれした図）から、ボタン一つで公開（Publish to GitHub）することも可能です。
