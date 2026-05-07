$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$payload = @{
    action = 'get_latest'
    droneId = 'JU32636BA3D2'
    date = '2026年04月'
    filename = '飛行日誌_JU32636BA3D2_202604.pdf'
    prefix = '飛行日誌'
} | ConvertTo-Json -Compress

$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

$req = [System.Net.WebRequest]::Create('https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec')
$req.Method = 'POST'
$req.ContentType = 'text/plain;charset=utf-8'
$req.ContentLength = $bytes.Length

$stream = $req.GetRequestStream()
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()

$res = $req.GetResponse()
$reader = New-Object System.IO.StreamReader($res.GetResponseStream())
$result = $reader.ReadToEnd()
$reader.Close()

$result | Out-File -FilePath .\response.json -Encoding UTF8
