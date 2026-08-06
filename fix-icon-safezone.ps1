Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\chronos-icon.png"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcBitmap = [System.Drawing.Bitmap]::FromFile($srcPath)

function CreateSafeZoneIcon($targetSize, $scaleFactor) {
    $canvas = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($canvas)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # 背景をダークカラー(#0b1320)で塗りつぶし
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#0b1320"))

    # 中心に75%の大きさで元画像を配置（セーフゾーン余白の確保）
    $scaledW = [int]($targetSize * $scaleFactor)
    $scaledH = [int]($targetSize * $scaleFactor)
    $offsetX = [int](($targetSize - $scaledW) / 2)
    $offsetY = [int](($targetSize - $scaledH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $scaledW, $scaledH)
    $g.DrawImage($srcBitmap, $destRect)

    $g.Dispose()
    return $canvas
}

$publicDir = "C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler\public"

# 512x512生成 (スケール0.76)
$icon512 = CreateSafeZoneIcon 512 0.76
$icon512.Save("$publicDir\pwa-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Save("$publicDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Dispose()

# 192x192生成
$icon192 = CreateSafeZoneIcon 192 0.76
$icon192.Save("$publicDir\pwa-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Dispose()

$srcBitmap.Dispose()
Write-Host "PWA safe zone icons successfully generated!"
