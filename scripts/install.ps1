# VisualnsCode installer for Windows (PowerShell)
# Usage (PowerShell):   irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex
# Usage (cmd / winget): powershell -c "irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex"
# After install, type `spxcode` in any terminal to open the app.
$ErrorActionPreference = 'Stop'

$REPO = "spxmiguel/visualnscode"
$GREEN  = "`e[32m"
$CYAN   = "`e[36m"
$BOLD   = "`e[1m"
$RESET  = "`e[0m"

function ok($msg)   { Write-Host "$GREEN✓$RESET $msg" }
function info($msg) { Write-Host "$CYAN→$RESET $msg" }
function fail($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  ${BOLD}VisualnsCode${RESET} — AI-native IDE installer" -ForegroundColor White
Write-Host "  https://github.com/$REPO"
Write-Host ""

# ── fetch latest release ──────────────────────────────────────────
info "Fetching latest release..."
try {
  $release = Invoke-RestMethod "https://api.github.com/repos/$REPO/releases/latest"
  $LATEST  = $release.tag_name
} catch {
  fail "Could not fetch latest release: $_"
}
info "Latest version: $LATEST"

$VERSION = $LATEST -replace '^v', ''

# ── download MSI ──────────────────────────────────────────────────
$FILE    = "VisualnsCode-$VERSION-x64.msi"
$URL     = "https://github.com/$REPO/releases/download/$LATEST/$FILE"
$DEST    = "$env:TEMP\$FILE"

info "Downloading $FILE..."
try {
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest -Uri $URL -OutFile $DEST
} catch {
  fail "Download failed: $_"
}

# ── install ───────────────────────────────────────────────────────
info "Installing (requires elevation for system-wide PATH)..."
$proc = Start-Process msiexec -ArgumentList "/i `"$DEST`" /quiet /norestart" -Wait -PassThru
if ($proc.ExitCode -ne 0) {
  # Try per-user install if system-wide failed
  info "Retrying as per-user install..."
  Start-Process msiexec -ArgumentList "/i `"$DEST`" /quiet /norestart ALLUSERS=0" -Wait
}
Remove-Item $DEST -Force

# ── verify ────────────────────────────────────────────────────────
$cmd = Get-Command spxcode -ErrorAction SilentlyContinue
if ($cmd) {
  ok "spxcode available at $($cmd.Source)"
} else {
  Write-Host ""
  Write-Host "  Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
}

Write-Host ""
ok "Installation complete!"
Write-Host ""
Write-Host "  Run ${BOLD}spxcode${RESET} to launch VisualnsCode."
Write-Host "  Docs: https://github.com/$REPO#readme"
Write-Host ""
