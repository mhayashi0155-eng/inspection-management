Dim objHTTP
Set objHTTP = CreateObject("MSXML2.XMLHTTP")

Dim url, payload
url = "https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec"
' fileData is base64 of "{}" 
payload = "{""action"":""save_append"",""droneId"":""JU32636BA3D2"",""date"":""2026年05月"",""filename"":""飛行日誌_JU32636BA3D2_202605.json"",""prefix"":""飛行日誌"",""fileData"":""e30="",""fieldValues"":{""test"":""abc""}}"

objHTTP.Open "POST", url, False
objHTTP.SetRequestHeader "Content-Type", "text/plain;charset=utf-8"
objHTTP.Send payload

Dim fso, f
Set fso = CreateObject("Scripting.FileSystemObject")
Set f = fso.CreateTextFile("c:\Users\koujiCAD\Desktop\右画面\点検表管理\pdf_tools\response.txt", True)
f.Write objHTTP.ResponseText
f.Close
