$deskLnk = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'

Write-Host "LNK Exists: $(Test-Path $deskLnk)"
Write-Host "ICO Exists: $(Test-Path $deskIco)"

if (Test-Path $deskIco) {
    $item = Get-Item $deskIco
    Write-Host "ICO Length: $($item.Length) bytes"
}

if (Test-Path $deskLnk) {
    $sh = New-Object -ComObject WScript.Shell
    $lnk = $sh.CreateShortcut($deskLnk)
    Write-Host "TargetPath: $($lnk.TargetPath)"
    Write-Host "IconLocation: $($lnk.IconLocation)"
    Write-Host "WorkingDirectory: $($lnk.WorkingDirectory)"
}
