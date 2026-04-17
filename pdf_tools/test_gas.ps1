$payload = @{
    action = 'get_latest'
    droneId = 'JU32636BA3D2'
    date = '2026年04月'
    filename = '飛行日誌_JU32636BA3D2_202604.pdf'
    prefix = '飛行日誌'
} | ConvertTo-Json -Compress

$response = Invoke-RestMethod -Uri 'https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec' -Method Post -Body $payload -ContentType 'text/plain;charset=utf-8'

$response | ConvertTo-Json -Depth 5
