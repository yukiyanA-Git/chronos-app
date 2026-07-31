$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'
$deskLnk = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$appIco  = Join-Path $appDir 'chronos-icon.ico'
$batPath = Join-Path $appDir 'start-app.bat'

if (Test-Path $deskIco) {
    Remove-Item $deskIco -Force -ErrorAction SilentlyContinue
}

if (Test-Path $deskLnk) {
    Remove-Item $deskLnk -Force -ErrorAction SilentlyContinue
}

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($deskLnk)
$lnk.TargetPath = 'cmd.exe'
$lnk.Arguments = "/c `"$batPath`""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'
$lnk.WindowStyle = 7

if (Test-Path $appIco) {
    $lnk.IconLocation = "$appIco,0"
}

$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Process explorer

Write-Host "Desktop Cleaned and Shortcut Recreated."
