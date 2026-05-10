function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var droneId = payload.droneId;
    var dateFolder = payload.date; // 例: "2026年05月" または "2026/05"
    var filename = payload.filename;
    var prefix = payload.prefix;
    var fileData = payload.fileData; // base64エンコードされたPDF
    var fieldValues = payload.fieldValues; // JSON文字列

    // 1. "点検表データ" フォルダの取得・作成
    var rootFolders = DriveApp.getFoldersByName("点検表データ");
    var rootFolder;
    if (rootFolders.hasNext()) {
      rootFolder = rootFolders.next();
    } else {
      rootFolder = DriveApp.createFolder("点検表データ");
    }

    // 2. 年月フォルダの取得・作成
    var folders = rootFolder.getFoldersByName(dateFolder);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = rootFolder.createFolder(dateFolder);
    }

    if (action === 'save_new' || action === 'save_append') {
      // PDFのBase64データをデコード
      var blob = Utilities.newBlob(Utilities.base64Decode(fileData), 'application/pdf', filename);

      var existingFiles = folder.getFilesByName(filename);
      var file;
      if (existingFiles.hasNext()) {
        file = existingFiles.next();
        // 同名ファイルがある場合はゴミ箱へ移動して新規作成（上書きの代わり）
        file.setTrashed(true);
      }
      file = folder.createFile(blob);

      // ★重要：テキストデータ(JSON)をファイルの説明(Description)に保存する
      // Google Driveのカスタムプロパティ(setProperties)は124バイトの制限があるため、
      // 32,000バイトまで保存できるDescriptionを使用します。
      if (fieldValues) {
        file.setDescription(fieldValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "File saved successfully",
        filename: filename
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'get_latest') {
      // 指定されたファイルの検索
      var files;
      if (dateFolder === "2000/01" && filename.includes("YYYYMM")) {
        // ワイルドカード検索
        files = rootFolder.searchFiles("title contains '" + prefix + "_" + droneId + "_'");
      } else {
        files = folder.getFilesByName(filename);
      }

      var latestFile = null;
      var latestTime = 0;
      
      while (files.hasNext()) {
        var f = files.next();
        if (f.getLastUpdated().getTime() > latestTime) {
          latestFile = f;
          latestTime = f.getLastUpdated().getTime();
        }
      }

      if (latestFile) {
        // ★重要：テキストデータ(JSON)をファイルの説明(Description)から読み込む
        var fv = latestFile.getDescription() || null;

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          filename: latestFile.getName(),
          fileData: Utilities.base64Encode(latestFile.getBlob().getBytes()),
          fieldValues: fv
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "File not found"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
