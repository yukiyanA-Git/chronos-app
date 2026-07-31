$code = Get-Content 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\make-standard-ico.cs' -Raw
Add-Type -TypeDefinition $code -ReferencedAssemblies 'System.Drawing'

[Program]::Main(@())

# ショートカットのIconLocationを更新
$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'
$deskLnk = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$vbsPath = Join-Path $appDir 'Chronos.vbs'

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($deskLnk)
$lnk.TargetPath = 'wscript.exe'
$lnk.Arguments = """$vbsPath"""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'
$lnk.IconLocation = "$deskIco,0"
$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

Write-Host "Shortcut updated with IconLocation: $($lnk.IconLocation)"

# エクスプローラー再起動
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Filter 'iconcache*.db' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Start-Process explorer

Write-Host "Done."
