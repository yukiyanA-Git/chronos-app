$deskLnk = 'C:\Users\Iwamoto\Desktop\DeployChronos.lnk'
$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$batPath = Join-Path $appDir 'deploy-app.bat'

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($deskLnk)
$lnk.TargetPath = $batPath
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Deploy Chronos to Web'
$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null
Write-Host 'Deploy shortcut created on desktop.'
