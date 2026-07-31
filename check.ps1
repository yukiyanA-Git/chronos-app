$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut('C:\Users\Iwamoto\Desktop\Chronos.lnk')
Write-Host $lnk.TargetPath
Write-Host $lnk.Arguments
Write-Host $lnk.IconLocation
Write-Host $lnk.WorkingDirectory
$ico = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\chronos-icon.ico'
Write-Host (Test-Path $ico)
Write-Host (Get-Item $ico).Length
