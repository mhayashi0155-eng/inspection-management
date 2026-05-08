$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$payload = @{
    action = 'save_append'
    droneId = 'JU32636BA3D2'
    date = '2026年05月'
    filename = 'test_data_only.json'
    prefix = '飛行日誌'
    fileData = ''
    fieldValues = @{ "test" = "123" }
}

$jsonPayload = $payload | ConvertTo-Json -Compress

$response = Invoke-RestMethod -Uri 'https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec' -Method Post -Body $jsonPayload -ContentType 'text/plain;charset=utf-8'

$response | ConvertTo-Json -Depth 10
