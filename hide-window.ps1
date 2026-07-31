$deskLnk = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$appIco  = Join-Path $appDir 'chronos-icon.ico'
$vbsPath = Join-Path $appDir 'Chronos.vbs'

if (Test-Path $deskLnk) {
    Remove-Item $deskLnk -Force -ErrorAction SilentlyContinue
}

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($deskLnk)
# wscript をターゲットにして完全に黒い画面(PowerShell/cmd)を出さずにバックグラウンド起動
$lnk.TargetPath = 'wscript.exe'
$lnk.Arguments = "`"$vbsPath`""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'

if (Test-Path $appIco) {
    $lnk.IconLocation = "$appIco,0"
}

$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Process explorer

Write-Host "Shortcut updated to hide PowerShell window."
