Add-Type -AssemblyName System.Drawing
$srcPath = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\chronos-icon.png'
$pubDir  = 'C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\public'

$img = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($src, $w, $h, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Resize-Image $img 192 192 (Join-Path $pubDir 'pwa-192x192.png')
Resize-Image $img 512 512 (Join-Path $pubDir 'pwa-512x512.png')
Resize-Image $img 180 180 (Join-Path $pubDir 'apple-touch-icon.png')
$img.Dispose()

Write-Host 'PWA PNG Icons Generated Successfully.'
