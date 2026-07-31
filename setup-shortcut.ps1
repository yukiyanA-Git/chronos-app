$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'
$lnkPath = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$vbsPath = Join-Path $appDir 'Chronos.vbs'
$srcIco  = Join-Path $appDir 'chronos-icon.ico'

Remove-Item $deskIco -Force -ErrorAction SilentlyContinue
Remove-Item $lnkPath -Force -ErrorAction SilentlyContinue
Copy-Item $srcIco $deskIco -Force
Write-Host ('Desktop ICO OK: ' + (Test-Path $deskIco))

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($lnkPath)
$lnk.TargetPath = 'wscript.exe'
$lnk.Arguments = """$vbsPath"""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'
$lnk.IconLocation = "$deskIco,0"
$lnk.Save()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($sh) | Out-Null

Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Filter 'iconcache*.db' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Start-Process explorer
Write-Host 'Done.'
