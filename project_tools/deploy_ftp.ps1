$ErrorActionPreference = 'Stop'

$ftpServer = "ftp://sv12.static.ne.jp/"
$ftpUsername = "yama522133"
$ftpPassword = "yama522311"

$localFilePath = "..\pdf_tools\pdf_app.html"
$remoteFilePath = "pdf_tools/pdf_app.html"

Write-Host "Uploading $localFilePath to ftp://sv12.static.ne.jp/$remoteFilePath..."

$uri = New-Object System.Uri($ftpServer + $remoteFilePath)
$ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
$ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
$ftpRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
$ftpRequest.UseBinary = $true
$ftpRequest.KeepAlive = $false

$fileStream = [System.IO.File]::OpenRead($localFilePath)
$requestStream = $ftpRequest.GetRequestStream()

$fileStream.CopyTo($requestStream)

$requestStream.Close()
$fileStream.Close()

$response = $ftpRequest.GetResponse()
Write-Host "Upload Complete, status: $($response.StatusDescription)"
$response.Close()
