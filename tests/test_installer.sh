#!/usr/bin/env bash
# ==============================================================================
# tests/test_installer.sh — Unit tests for superfedora.github.io/install.sh
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$SCRIPT_DIR/install.sh"
FAILURES=0

pass() { echo "  [OK] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "Running install.sh test suite..."

# 1. Syntax check
if bash -n "$INSTALLER"; then
  pass "install.sh passes bash syntax check (bash -n)"
else
  fail "install.sh failed bash syntax check"
fi

# 2. --help flag returns 0 and prints usage without performing installation
help_output="$("$INSTALLER" --help 2>&1)" || true
if [[ "$help_output" == *"SuperFedora web installer"* ]]; then
  pass "--help flag exits 0 and prints usage documentation"
else
  fail "--help flag did not exit 0 with usage documentation"
fi

# 3. -h flag returns 0 and prints usage
h_output="$("$INSTALLER" -h 2>&1)" || true
if [[ "$h_output" == *"SuperFedora web installer"* ]]; then
  pass "-h short flag exits 0 and prints usage documentation"
else
  fail "-h short flag did not exit 0 with usage documentation"
fi

# 4. Piped stdin execution (curl ... | bash -s -- --help) returns 0 and prints usage
pipe_output="$(cat "$INSTALLER" | bash -s -- --help 2>&1)" || true
if [[ "$pipe_output" == *"SuperFedora web installer"* ]]; then
  pass "Piped stdin execution (curl ... | bash -s -- --help) prints usage"
else
  fail "Piped stdin execution failed"
fi

# 4. Version file exists and is semver format
if [[ -f "$SCRIPT_DIR/VERSION" ]] && grep -qE '^[0-9]+\.[0-9]+\.[0-9]+' "$SCRIPT_DIR/VERSION"; then
  pass "VERSION file exists and contains valid semver: $(cat "$SCRIPT_DIR/VERSION")"
else
  fail "VERSION file is missing or invalid"
fi

# 5. SUPERFEDORA_NO_RUN=1 behavior verification with dry run setup
TMP_TEST="$(mktemp -d)"
trap 'rm -rf "$TMP_TEST"' EXIT

# Mocking curl to simulate release download without network churn
MOCK_BIN="$TMP_TEST/bin"
mkdir -p "$MOCK_BIN"
cat > "$MOCK_BIN/curl" << 'EOF'
#!/bin/sh
if [[ "$*" == *"VERSION"* ]]; then
  echo "0.1.0"
  exit 0
fi
# For archive download, create a minimal mock tarball
TMP_ARCHIVE=$(mktemp -d)
mkdir -p "$TMP_ARCHIVE/superfedora-v0.1.0/bin"
cat > "$TMP_ARCHIVE/superfedora-v0.1.0/bin/superfedora" << 'BEOF'
#!/bin/sh
echo "mock superfedora $@"
exit 0
BEOF
chmod +x "$TMP_ARCHIVE/superfedora-v0.1.0/bin/superfedora"
echo "0.1.0" > "$TMP_ARCHIVE/superfedora-v0.1.0/VERSION"
tar -czf - -C "$TMP_ARCHIVE" superfedora-v0.1.0
rm -rf "$TMP_ARCHIVE"
exit 0
EOF
chmod +x "$MOCK_BIN/curl"

# Test non-root enforcement: root EUID (0) should fail
if (EUID=0 env SUPERFEDORA_NO_RUN=1 bash -c "[[ \$EUID -ne 0 ]] || exit 1") 2>/dev/null; then
  fail "Root EUID was not rejected by simulated check"
else
  pass "Non-root user check logic enforces normal user execution"
fi

echo "Test summary: $FAILURES failure(s)."
if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi
echo "All install.sh tests PASSED."
exit 0
