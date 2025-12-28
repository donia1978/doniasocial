Set-ExecutionPolicy -Scope Process Bypass -Force

$Root = "C:\lovable\doniasocial"
$Repo = "https://github.com/donia1978/doniasocial.git"

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "[OK]  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Die($m){ Write-Host "[ERR] $m" -ForegroundColor Red; exit 1 }

if (!(Test-Path $Root)) { Die "Missing folder: $Root" }
Set-Location $Root

# --- 0) Stop lock holders (node/vite) ---
Info "Stopping node/vite to unlock node_modules..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process vite -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# --- 1) Patch App.tsx: Toaster not defined ---
$AppPath = Join-Path $Root "src\App.tsx"
if (Test-Path $AppPath) {
  $app = Get-Content $AppPath -Raw

  $hasToasterUsage = ($app -match "<Toaster\b")
  $hasToasterImport = ($app -match "import\s+\{\s*Toaster\s*\}\s+from\s+['`""]")

  if ($hasToasterUsage -and -not $hasToasterImport) {
    Info "Patching Toaster import in src/App.tsx ..."

    # Prefer shadcn toaster if it exists, else sonner
    $shadcnToaster = Join-Path $Root "src\components\ui\toaster.tsx"
    $importLine = ""
    if (Test-Path $shadcnToaster) {
      $importLine = "import { Toaster } from `"@/components/ui/toaster`";"
    } else {
      $importLine = "import { Toaster } from `"sonner`";"
    }

    # Insert import after last import line
    if ($app -match "^(import .+?;\s*)+" ) {
      $app = [regex]::Replace($app, "^(import .+?;\s*)+", { param($m) $m.Value + $importLine + "`r`n" }, 1)
    } else {
      $app = $importLine + "`r`n" + $app
    }

    Set-Content -Path $AppPath -Value $app -Encoding UTF8
    Ok "App.tsx patched (Toaster import added)"
  } else {
    Ok "App.tsx Toaster import OK (or Toaster not used)"
  }
} else {
  Warn "src/App.tsx not found (skipping Toaster patch)"
}

# --- 2) Ensure .env is NOT ignored (you want to keep it in Git) ---
$gi = Join-Path $Root ".gitignore"
if (Test-Path $gi) {
  $g = Get-Content $gi -Raw

  # Remove ignore lines for .env / .env.* if present
  $g2 = $g `
    -replace "(?m)^\s*\.env\.\*\s*$","" `
    -replace "(?m)^\s*\.env\s*$","" `
    -replace "(?m)^\s*\*\.env\s*$","" `
    -replace "(?m)^\s*\*\.env\.\*\s*$",""

  if ($g2 -ne $g) {
    Set-Content -Path $gi -Value $g2 -Encoding UTF8
    Ok ".gitignore updated to NOT ignore .env"
  } else {
    Ok ".gitignore already does not ignore .env"
  }
} else {
  Warn ".gitignore not found (OK)"
}

# --- 3) Clean build artifacts + node_modules (robust Windows) ---
$targets = @("node_modules",".vite","dist","coverage",".next","out")
foreach ($t in $targets) {
  $p = Join-Path $Root $t
  if (Test-Path $p) {
    Info "Removing $t (robust)..."
    cmd /c "rmdir /s /q `"$p`"" | Out-Null
  }
}
Ok "Clean done (node_modules/dist/etc removed)"

# --- 4) Install & verify build ---
Info "npm install..."
npm install
if ($LASTEXITCODE -ne 0) { Die "npm install failed" }
Ok "npm install OK"

Info "npm run build (verification)..."
npm run build
if ($LASTEXITCODE -ne 0) { Die "npm run build failed" }
Ok "Build OK"

# --- 5) Git: set remote, add, commit, push ---
if (!(Test-Path (Join-Path $Root ".git"))) {
  Info "Initializing git repo..."
  git init | Out-Null
  if ($LASTEXITCODE -ne 0) { Die "git init failed" }
}

Info "Setting remote origin..."
git remote remove origin 2>$null | Out-Null
git remote add origin $Repo | Out-Null

Info "git status..."
git status

Info "Staging all changes..."
git add -A
if ($LASTEXITCODE -ne 0) { Die "git add failed" }

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$msg = "chore: fix+clean+build+push ($ts)"

Info "Committing..."
git commit -m $msg 2>$null | Out-Null
# commit may fail if nothing to commit; that's fine
if ($LASTEXITCODE -eq 0) { Ok "Commit created" } else { Warn "No new commit (nothing changed)" }

Info "Pushing to main..."
git branch -M main | Out-Null
git push -u origin main
if ($LASTEXITCODE -ne 0) { Die "git push failed" }

Ok "DONE ✅ Clean + build verified + pushed to GitHub"
Write-Host "Repo: $Repo" -ForegroundColor Green
