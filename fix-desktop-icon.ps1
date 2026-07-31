Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class ShellUtil {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(uint wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@

$appDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler'
$pngPath = Join-Path $appDir 'chronos-icon.png'
$icoPath = Join-Path $appDir 'chronos-icon.ico'
$deskIco = 'C:\Users\Iwamoto\Desktop\chronos-icon.ico'
$deskLnk = 'C:\Users\Iwamoto\Desktop\Chronos.lnk'
$vbsPath = Join-Path $appDir 'Chronos.vbs'

Write-Host "Creating Standard Windows ICO file..."

# PNGから標準Bitmapを生成してHICON経由で標準ICOに変換
if (Test-Path $pngPath) {
    $srcImg = [System.Drawing.Image]::FromFile($pngPath)
    
    # 256x256 32bpp ARGB Bitmap
    $bmp = New-Object System.Drawing.Bitmap(256, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, 256, 256)
    $g.Dispose()
    $srcImg.Dispose()

    # HICONから標準Iconを作成
    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)

    # アプリフォルダとデスクトップの両方に保存
    $fs1 = [System.IO.File]::Create($icoPath)
    $icon.Save($fs1)
    $fs1.Close()

    $fs2 = [System.IO.File]::Create($deskIco)
    $icon.Save($fs2)
    $fs2.Close()

    $icon.Dispose()
    $bmp.Dispose()
    
    Write-Host "ICO created successfully. App ICO: $(Test-Path $icoPath), Desktop ICO: $(Test-Path $deskIco)"
}

# ショートカットの作成・更新
Write-Host "Updating Shortcut..."
$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($deskLnk)
$lnk.TargetPath = 'wscript.exe'
$lnk.Arguments = """$vbsPath"""
$lnk.WorkingDirectory = $appDir
$lnk.Description = 'Chronos'
# アイコンパスを確実に指定
$lnk.IconLocation = "$deskIco"
$lnk.Save()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sh) | Out-Null

Write-Host "Shortcut updated. IconLocation is: $($lnk.IconLocation)"

# エクスプローラーおよびWindowsシェルへアイコン変更を通知 (SHCNE_ASSOCCHANGED = 0x08000000, SHCNF_FLUSH = 0x1000)
Write-Host "Notifying Windows Shell of Icon Change..."
[ShellUtil]::SHChangeNotify(0x08000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)

# アイコンキャッシュファイルの削除とエクスプローラー再起動
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Filter 'iconcache*.db' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Start-Process explorer

Write-Host "Desktop Icon Fix Procedure Finished."
