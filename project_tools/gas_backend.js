function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var droneId = payload.droneId;
    var droneFullname = payload.droneFullname || droneId; // 新規追加
    var yearFolder = payload.year; // 例: "2026年"
    var monthFolder = payload.month; // 例: "05月"
    var dateFolder = payload.date; // 互換性維持用
    var filename = payload.filename;
    var prefix = payload.prefix;
    var fileData = payload.fileData; // base64エンコードされたPDF
    var fieldValues = payload.fieldValues; // JSON文字列

    // フォルダ取得・作成の共通関数
    function getOrCreateFolder(parent, name) {
      var folders = parent.getFoldersByName(name);
      if (folders.hasNext()) return folders.next();
      return parent.createFolder(name);
    }

    // 1. "点検表データ" フォルダ (Root)
    var rootFolders = DriveApp.getFoldersByName("点検表データ");
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder("点検表データ");

    // 2. 機体名フォルダ
    var droneFolder = getOrCreateFolder(rootFolder, droneFullname);

    // 3. 年フォルダ
    var targetYear = yearFolder || (dateFolder ? dateFolder.substring(0, 5) : ""); // Fallback
    var yFolder = getOrCreateFolder(droneFolder, targetYear);

    // 4. 月フォルダ
    var targetMonth = monthFolder || (dateFolder ? dateFolder.substring(5) : ""); // Fallback
    var mFolder = getOrCreateFolder(yFolder, targetMonth);

    // 5. 種類フォルダ (prefix)
    var folder = getOrCreateFolder(mFolder, prefix);

    if (action === 'save_new' || action === 'save_append') {
      var existingFiles = folder.getFilesByName(filename);
      var file;
      
      if (existingFiles.hasNext()) {
        file = existingFiles.next();
        // action が save_append かつ fileData が空（または特定のフラグ）の場合はPDFを更新しない
        // ※データ(JSON)だけを更新したい場合
        if (action === 'save_append' && (!fileData || fileData === "")) {
          // 何もしない（Description更新へ）
        } else {
          // PDFを更新する場合（上書き）
          file.setTrashed(true);
          var blob = Utilities.newBlob(Utilities.base64Decode(fileData), 'application/pdf', filename);
          file = folder.createFile(blob);
        }
      } else {
        // 新規作成
        var blob = Utilities.newBlob(Utilities.base64Decode(fileData), 'application/pdf', filename);
        file = folder.createFile(blob);
      }

      // 説明欄(Description)にデータを保存
      if (fieldValues) {
        file.setDescription(fieldValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data saved successfully",
        filename: filename,
        folderPath: droneFullname + "/" + targetYear + "/" + targetMonth + "/" + prefix
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'get_latest') {
      // 検索ロジック (ウォーターフォール)
      var files = null;

      // 1. 指定されたフォルダ内を検索
      files = folder.getFilesByName(filename);
      
      // 2. なければルート以下をワイルドカード/名前で検索
      if (!files.hasNext()) {
        if (dateFolder === "2000/01" && filename.includes("YYYYMM")) {
          files = rootFolder.searchFiles("title contains '" + prefix + "_" + droneId + "_'");
        } else {
          files = rootFolder.searchFiles("title = '" + filename + "'");
        }
      }

      var latestFile = null;
      var latestTime = 0;
      
      while (files && files.hasNext()) {
        var f = files.next();
        if (f.getLastUpdated().getTime() > latestTime) {
          latestFile = f;
          latestTime = f.getLastUpdated().getTime();
        }
      }

      if (latestFile) {
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
