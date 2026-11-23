param(
    [string]$SignToolPath = '',
    [string]$TimestampUrl = 'http://timestamp.digicert.com'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$launcherDir = Join-Path $root 'launcher'
$distDir = Join-Path $root 'dist'
$buildDir = Join-Path $root 'build\launcher'
$releaseDir = Join-Path $root 'release'
$assetsZip = Join-Path $buildDir 'assets.zip'
$iconPath = Join-Path $buildDir 'app.ico'
$exePath = Join-Path $releaseDir 'LECCOM Schedule Builder.exe'
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'

if (-not (Test-Path -LiteralPath $csc)) {
    throw "C# compiler not found at $csc"
}

Write-Host 'Building web assets...'
Push-Location $root
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed.' }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath (Join-Path $distDir 'index.html'))) {
    throw 'dist/index.html was not generated.'
}

if (Test-Path -LiteralPath $buildDir) {
    Remove-Item -LiteralPath $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

function New-AppIcon {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    Add-Type -AssemblyName System.Drawing
    $image = [System.Drawing.Image]::FromFile($Source)
    try {
        $size = 256
        $bitmap = New-Object System.Drawing.Bitmap -ArgumentList $size, $size
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $scale = [Math]::Min($size / $image.Width, $size / $image.Height)
            $drawWidth = [int][Math]::Round($image.Width * $scale)
            $drawHeight = [int][Math]::Round($image.Height * $scale)
            $x = [int](($size - $drawWidth) / 2)
            $y = [int](($size - $drawHeight) / 2)
            $graphics.DrawImage($image, $x, $y, $drawWidth, $drawHeight)

            $pngStream = New-Object System.IO.MemoryStream
            try {
                $bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
                $png = $pngStream.ToArray()
            }
            finally {
                $pngStream.Dispose()
            }
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
    finally {
        $image.Dispose()
    }

    $file = [System.IO.File]::Create($Destination)
    try {
        $writer = New-Object System.IO.BinaryWriter -ArgumentList $file
        try {
            $writer.Write([UInt16]0)
            $writer.Write([UInt16]1)
            $writer.Write([UInt16]1)
            $writer.Write([Byte]0)
            $writer.Write([Byte]0)
            $writer.Write([Byte]0)
            $writer.Write([Byte]0)
            $writer.Write([UInt16]1)
            $writer.Write([UInt16]32)
            $writer.Write([UInt32]$png.Length)
            $writer.Write([UInt32]22)
            $writer.Write($png)
        }
        finally {
            $writer.Dispose()
        }
    }
    finally {
        $file.Dispose()
    }
}

$logo = Join-Path $root 'public\logos\san-agustin-parish.jpeg'
if (Test-Path -LiteralPath $logo) {
    Write-Host 'Creating application icon...'
    New-AppIcon -Source $logo -Destination $iconPath
    Copy-Item -LiteralPath $iconPath -Destination (Join-Path $distDir 'favicon.ico') -Force
}
else {
    throw 'Parish logo was not found for the application icon.'
}

Write-Host 'Packaging web assets...'
Compress-Archive -Path (Join-Path $distDir '*') -DestinationPath $assetsZip -CompressionLevel Optimal -Force

$package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$version = [string]$package.version + '.0'
$assemblyInfo = Join-Path $buildDir 'AssemblyInfo.cs'
$assemblySource = @"
using System.Reflection;
[assembly: AssemblyTitle("LECCOM Schedule Builder")]
[assembly: AssemblyDescription("LECCOM Schedule Builder")]
[assembly: AssemblyCompany("LECCOM")]
[assembly: AssemblyProduct("LECCOM Schedule Builder")]
[assembly: AssemblyVersion("$version")]
[assembly: AssemblyFileVersion("$version")]
"@
Set-Content -LiteralPath $assemblyInfo -Value $assemblySource -Encoding ASCII

$framework = Split-Path -Parent $csc
$sources = @(
    (Join-Path $launcherDir 'Program.cs'),
    (Join-Path $launcherDir 'AssetStore.cs'),
    (Join-Path $launcherDir 'DataStore.cs'),
    (Join-Path $launcherDir 'LocalServer.cs'),
    $assemblyInfo
)
foreach ($source in $sources) {
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing launcher source: $source"
    }
}

if (Test-Path -LiteralPath $exePath) {
    Remove-Item -LiteralPath $exePath -Force
}

Write-Host 'Compiling launcher...'
$compilerArgs = @(
    '/nologo',
    '/target:winexe',
    '/platform:anycpu',
    '/optimize+',
    ('/out:' + $exePath),
    ('/win32icon:' + $iconPath),
    '/resource:assets.zip,LECCOM.assets.zip',
    ('/r:' + (Join-Path $framework 'System.dll')),
    ('/r:' + (Join-Path $framework 'System.Core.dll')),
    ('/r:' + (Join-Path $framework 'System.Drawing.dll')),
    ('/r:' + (Join-Path $framework 'System.Windows.Forms.dll')),
    ('/r:' + (Join-Path $framework 'System.IO.Compression.dll')),
    ('/r:' + (Join-Path $framework 'System.IO.Compression.FileSystem.dll')),
    ('/r:' + (Join-Path $framework 'System.Web.Extensions.dll'))
) + $sources

Push-Location $buildDir
try {
    & $csc $compilerArgs
    if ($LASTEXITCODE -ne 0) { throw 'Launcher compilation failed.' }
}
finally {
    Pop-Location
}

Copy-Item -LiteralPath (Join-Path $launcherDir 'README.txt') -Destination (Join-Path $releaseDir 'README.txt') -Force

if (-not [string]::IsNullOrWhiteSpace($SignToolPath)) {
    Write-Host 'Signing executable...'
    & $SignToolPath sign /fd SHA256 /tr $TimestampUrl /td SHA256 /a $exePath
    if ($LASTEXITCODE -ne 0) { throw 'Code signing failed.' }
}

$size = [Math]::Round((Get-Item -LiteralPath $exePath).Length / 1MB, 1)
Write-Host ''
Write-Host "Release created: $releaseDir"
Write-Host "Executable: $exePath ($size MB)"
