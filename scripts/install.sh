#!/usr/bin/env bash
# VisualnsCode installer — macOS & Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.sh | bash
# After install, type `spxcode` in any terminal to open the app.
set -euo pipefail

REPO="spxmiguel/visualnscode"
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
RED="\033[31m"
RESET="\033[0m"

print() { printf "%b\n" "$1"; }
ok()    { print "${GREEN}✓${RESET} $1"; }
info()  { print "${CYAN}→${RESET} $1"; }
fail()  { print "${RED}✗${RESET} $1"; exit 1; }

print ""
print "${BOLD}  VisualnsCode${RESET} — AI-native IDE installer"
print "  https://github.com/$REPO"
print ""

# ── detect OS & arch ──────────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)  ARCH_KEY="x64" ;;
  aarch64|arm64) ARCH_KEY="arm64" ;;
  *) fail "Unsupported architecture: $ARCH" ;;
esac

case "$OS" in
  Darwin) PLATFORM="mac" ;;
  Linux)  PLATFORM="linux" ;;
  *)      fail "Unsupported OS: $OS. Use install.ps1 for Windows." ;;
esac

# ── fetch latest release ──────────────────────────────────────────
info "Fetching latest release..."
LATEST=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep '"tag_name"' \
  | sed 's/.*"tag_name": *"\(.*\)".*/\1/')

if [ -z "$LATEST" ]; then
  fail "Could not determine latest release. Check https://github.com/$REPO/releases"
fi

info "Latest version: $LATEST"

# ── download & install ────────────────────────────────────────────
BASE_URL="https://github.com/$REPO/releases/download/$LATEST"

if [ "$PLATFORM" = "mac" ]; then
  FILE="VisualnsCode-${LATEST#v}-${ARCH_KEY}.pkg"
  URL="$BASE_URL/$FILE"
  DEST="/tmp/$FILE"

  info "Downloading $FILE..."
  curl -fsSL --progress-bar -o "$DEST" "$URL"

  info "Installing pkg (requires sudo)..."
  sudo installer -pkg "$DEST" -target / -allowUntrusted
  rm -f "$DEST"

  # Symlink is created by pkg postinstall script.
  # Verify it exists:
  if command -v spxcode &>/dev/null; then
    ok "spxcode is available at $(command -v spxcode)"
  else
    # Fallback: create symlink manually
    sudo ln -sf "/Applications/VisualnsCode.app/Contents/MacOS/spxcode" "/usr/local/bin/spxcode"
    ok "spxcode symlink created at /usr/local/bin/spxcode"
  fi

elif [ "$PLATFORM" = "linux" ]; then
  FILE="VisualnsCode-${LATEST#v}-${ARCH_KEY}.AppImage"
  URL="$BASE_URL/$FILE"

  # Install to ~/.local/bin (no sudo needed)
  INSTALL_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
  mkdir -p "$INSTALL_DIR"
  DEST="$INSTALL_DIR/spxcode"

  info "Downloading $FILE..."
  curl -fsSL --progress-bar -o "$DEST" "$URL"
  chmod +x "$DEST"
  ok "spxcode installed at $DEST"

  # Warn if not in PATH
  if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
    print ""
    print "  ${BOLD}Add $INSTALL_DIR to your PATH:${RESET}"
    print "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
    print "  source ~/.bashrc"
    print ""
  fi
fi

print ""
ok "Installation complete!"
print ""
print "  Run ${BOLD}spxcode${RESET} to launch VisualnsCode."
print "  Docs: https://github.com/$REPO#readme"
print ""
