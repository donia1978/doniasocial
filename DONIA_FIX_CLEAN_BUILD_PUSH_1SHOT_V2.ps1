Set-ExecutionPolicy -Scope Process Bypass -Force

$Root = "C:\lovable\doniasocial"
$Repo = "https://github.com/donia1978/doniasocial.git"

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK]  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Die($m){ Write-Host "[ERR] $m" -ForegroundColor Red; exit 1 }

if (!(Test-Path $Root)) { Die "Missing folder: $Root" }
Set-Location $Root

# 0) Stop node/vite (unlock node_modules)
Info "Stopping node/vite..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process vite -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 1) Patch App.tsx (fix black screen: Toaster is not defined)
$AppPath = Join-Path $Root "src\App.tsx"
if (Test-Path $AppPath) {
  $lines = Get-Content $AppPath

  $hasToasterUsage = $false
  $hasToasterImport = $false
  foreach($ln in $lines){
    if ($ln -match "<Toaster\b") { $hasToasterUsage = $true }
    if ($ln -match "import\s+\{\s*Toaster\s*\}") { $hasToasterImport = $true }
  }

  if ($hasToasterUsage -and -not $hasToasterImport) {
    Info "App.tsx uses <Toaster /> but has no import => patching..."

    $shadcnToaster = Join-Path $Root "src\components\ui\toaster.tsx"
    $importLine = $null
    if (Test-Path $shadcnToaster) {
      $importLine = 'import { Toaster } from "@/components/ui/toaster";'
    } else {
      $importLine = 'import { Toaster } from "sonner";'
    }

    # Insert after last import line
    $insertAt = 0
    for($i=0; $i -lt $lines.Count; $i++){
      if ($lines[$i] -match "^\s*import\s+") { $insertAt = $i + 1 }
    }

    $new = New-Object System.Collections.Generic.List[string]
    for($i=0; $i -lt $lines.Count; $i++){
      if ($i -eq $insertAt) { $new.Add($importLine) }
      $new.Add($lines[$i])
    }

    Set-Content -Path $AppPath -Value $new.ToArray() -Encoding UTF8
    Ok "Patched: Toaster import added to App.tsx"
  } else {
    Ok "App.tsx Toaster OK (or not used)."
  }
} else {
  Warn "src\App.tsx not found (skip)"
}

# 2) Ensure .env is kept in git (remove ignores from .gitignore if present)
$gi = Join-Path $Root ".gitignore"
if (Test-Path $gi) {
  $g = Get-Content $gi
  $out = New-Object System.Collections.Generic.List[string]
  foreach($ln in $g){
    $t = $ln.Trim()
    if ($t -eq ".env" -or $t -eq ".env.*" -or $t -eq "*.env" -or $t -eq "*.env.*") {
      continue
    }
    $out.Add($ln)
  }
  Set-Content -Path $gi -Value $out.ToArray() -Encoding UTF8
  Ok ".gitignore updated (does NOT ignore .env)"
} else {
  Warn ".gitignore not found (ok)"
}

# 3) Clean folders (robust Windows)
$targets = @("node_modules",".vite","dist","coverage",".next","out")
foreach ($t in $targets) {
  $p = Join-Path $Root $t
  if (Test-Path $p) {
    Info "Removing $t..."
    cmd /c "rmdir /s /q `"$p`"" | Out-Null
  }
}
Ok "Clean done"

# 4) Install + Build
Info "npm install..."
npm install
if ($LASTEXITCODE -ne 0) { Die "npm install failed" }
Ok "npm install OK"

Info "npm run build..."
npm run build
if ($LASTEXITCODE -ne 0) { Die "npm run build failed" }
Ok "Build OK"

# 5) Git init/remote/push
if (!(Test-Path (Join-Path $Root ".git"))) {
  Info "git init..."
  git init | Out-Null
  if ($LASTEXITCODE -ne 0) { Die "git init failed" }
}

Info "Set origin remote..."
git remote remove origin 2>$null | Out-Null
git remote add origin $Repo | Out-Null

Info "git add -A..."
git add -A
if ($LASTEXITCODE -ne 0) { Die "git add failed" }

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$msg = "chore: fix+clean+build+push ($ts)"

Info "git commit..."
git commit -m $msg 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Ok "Commit created" } else { Warn "No commit (nothing changed)" }

Info "Push main..."
git branch -M main | Out-Null
git push -u origin main
if ($LASTEXITCODE -ne 0) { Die "git push failed" }

Ok "DONE ✅ Clean + build verified + pushed"
Write-Host "Repo: $Repo" -ForegroundColor Green
