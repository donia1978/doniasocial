# DONIA backup (Robocopy) - excludes node_modules, dist, build artifacts, caches
param(
  [string]$Source = "C:\lovable\doniasocial",
  [string]$TargetRoot = "C:\Users\MOUNA\OneDrive\Desktop\don\backups"
)

$ErrorActionPreference="Stop"
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$Target = Join-Path $TargetRoot "doniasocial_$date"

New-Item -ItemType Directory -Force -Path $Target | Out-Null

$excludeDirs = @("node_modules",".git","dist","build",".vite",".cache",".turbo",".next","coverage","tmp","temp")
$excludeFiles = @("*.log","*.tmp","*.tsbuildinfo")

$xd = @()
foreach($d in $excludeDirs){ $xd += "/XD"; $xd += $d }

$xf = @()
foreach($f in $excludeFiles){ $xf += "/XF"; $xf += $f }

robocopy $Source $Target /E /Z /R:2 /W:1 /NFL /NDL /NP /NJH /NJS /XJ @$xd @$xf

Write-Host "Backup done -> $Target"
