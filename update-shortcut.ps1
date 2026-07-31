$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$pngPath = Join-Path $appDir 'chronos-icon.png'
$icoPath = Join-Path $appDir 'chronos-icon.ico'
$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'
$lnkPath = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$vbsPath = Join-Path $appDir 'Chronos.vbs'

# アイコン画像とショートカットの更新
if (Test-Path $pngPath) {
    # PNGからICO生成 (Make-ico.js を使用)
    Set-Location $appDir
    $env:PATH = "C:\Users\Iwamoto\.gemini\antigravity\node-portable\node-v22.11.0-win-x64;$env:PATH"
    node make-ico.js
    
    if (Test-Path $icoPath) {
        Copy-Item $icoPath $deskIco -Force
    }
}

$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($lnkPath)
$lnk.TargetPath = 'wscript.exe'
$lnk.Arguments = """$vbsPath"""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'
if (Test-Path $deskIco) {
    $lnk.IconLocation = "$deskIco,0"
}
$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

# エクスプローラー再起動
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Filter 'iconcache*.db' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Start-Process explorer
Write-Host 'Shortcut and Icon Updated Successfully.'
