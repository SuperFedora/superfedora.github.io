#!/usr/bin/env python3
"""tests/test_page_rules.py — Comprehensive validation test suite for superfedora.github.io.

Verifies:
1. HTML5 tag balance and well-formedness of index.html.
2. Local asset integrity: all referenced images, styles, scripts, anchors exist on disk.
3. JavaScript syntax validation across all scripts via node --check.
4. Critical metadata, stylesheets, and script files presence.
5. The Page Rule: all code files (.sh, .js, .css, .py) are between 16 and 256 lines.
6. Directory density: no functional directory exceeds 12 files.
7. Strict Zero-Emoji Invariant: zero Unicode emojis across all files.
"""
import os
import subprocess
import sys
from html.parser import HTMLParser

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(REPO_ROOT, "index.html")
EXCLUDE_DIRS = {".git", ".github"}
CODE_EXTENSIONS = {".js", ".css", ".sh", ".py", ".svg", ".qml", ".rs"}


def check_html_structure():
    """Verify HTML5 tag balance in index.html."""
    class TagBalanceValidator(HTMLParser):
        VOID_TAGS = {
            "area", "base", "br", "col", "embed", "hr", "img",
            "input", "link", "meta", "param", "source", "track", "wbr"
        }
        def __init__(self):
            super().__init__()
            self.stack = []
            self.issues = []
            self.ids = set()
            self.links = []

        def handle_starttag(self, tag, attrs):
            t = tag.lower()
            ad = dict(attrs)
            if "id" in ad:
                self.ids.add(ad["id"])
            for k in ("href", "src"):
                if k in ad:
                    self.links.append((tag, k, ad[k], self.getpos()[0]))
            if t not in self.VOID_TAGS:
                self.stack.append((t, self.getpos()))

        def handle_endtag(self, tag):
            t = tag.lower()
            if t in self.VOID_TAGS:
                return
            if not self.stack:
                self.issues.append(f"Unexpected end tag </{t}> at line {self.getpos()[0]}")
                return
            last, pos = self.stack.pop()
            if last != t:
                self.issues.append(f"Mismatched tag: expected </{last}>, got </{t}> at line {self.getpos()[0]}")

    if not os.path.exists(INDEX_PATH):
        return ["index.html not found"], set(), []

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    val = TagBalanceValidator()
    val.feed(content)
    if val.stack:
        for tag, pos in val.stack:
            val.issues.append(f"Unclosed tag <{tag}> opened at line {pos[0]}")
    return val.issues, val.ids, val.links


def check_local_assets_and_anchors(ids, links):
    """Ensure all local assets exist and internal anchors match IDs."""
    issues = []
    for tag, attr, val, line in links:
        val_clean = val.strip()
        if not val_clean:
            continue
        if val_clean.startswith("#"):
            target_id = val_clean[1:]
            if target_id and target_id not in ids:
                issues.append(f"Broken anchor #{target_id} at line {line} (<{tag} {attr}='{val}'>)")
        elif not val_clean.startswith(("http://", "https://", "mailto:", "data:")):
            path_part = val_clean.split("?")[0].split("#")[0]
            target_path = os.path.join(REPO_ROOT, path_part)
            if not os.path.exists(target_path):
                issues.append(f"Missing local asset '{val}' at line {line} (<{tag} {attr}='{val}'>)")
    return issues


def check_js_syntax():
    """Verify JS files syntax with node --check."""
    js_dir = os.path.join(REPO_ROOT, "js")
    if not os.path.isdir(js_dir):
        return ["js directory missing"]
    issues = []
    for f in sorted(os.listdir(js_dir)):
        if f.endswith(".js"):
            path = os.path.join(js_dir, f)
            res = subprocess.run(["node", "--check", path], capture_output=True, text=True)
            if res.returncode != 0:
                issues.append(f"JS syntax error in {f}:\n{res.stderr.strip()}")
    return issues


def check_critical_files():
    """Verify presence and non-empty status of critical files."""
    required = [
        "index.html", "install.sh", "VERSION", "favicon.svg",
        "assets/branding/avatar.jpg",
        "styles/tokens.css", "styles/reset.css", "styles/typography.css",
        "styles/nav.css", "styles/dock.css", "styles/marquee.css",
        "styles/mainscreen.css", "styles/hero.css", "styles/panels.css",
        "styles/modules.css", "styles/keybindings.css", "styles/crt.css",
        "js/audio.js", "js/theme.js", "js/crt.js", "js/copy.js",
        "js/dock.js", "js/marquees.js", "js/modules.js", "js/rotate.js",
        "js/starfield.js", "js/sun.js", "js/hud.js"
    ]
    issues = []
    for rel in required:
        full = os.path.join(REPO_ROOT, rel)
        if not os.path.exists(full):
            issues.append(f"Missing required file: {rel}")
        elif os.path.getsize(full) == 0:
            issues.append(f"Empty required file: {rel}")
    return issues


def check_line_sizing_and_density():
    """Verify 16 <= lines <= 256 for code, README.md < 25 lines, and <= 12 files per directory."""
    sizing_issues = []
    density_issues = []
    readme_path = os.path.join(REPO_ROOT, "README.md")
    if os.path.exists(readme_path):
        with open(readme_path, "rb") as fp:
            rlines = sum(1 for _ in fp)
        if rlines >= 25:
            sizing_issues.append(f"README.md: {rlines} lines (must be < 25)")

    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        rel_dir = os.path.relpath(root, REPO_ROOT)

        functional_files = [f for f in files if not f.startswith(".")]
        if len(functional_files) > 12:
            density_issues.append(f"Directory {rel_dir} exceeds 12 files ({len(functional_files)} files)")

        for f in functional_files:
            ext = os.path.splitext(f)[1]
            if ext in CODE_EXTENSIONS:
                fpath = os.path.join(root, f)
                rel_path = os.path.relpath(fpath, REPO_ROOT)
                with open(fpath, "rb") as fp:
                    lines = sum(1 for _ in fp)
                if lines < 16:
                    sizing_issues.append(f"{rel_path}: {lines} lines (under 16)")
                elif lines > 256:
                    sizing_issues.append(f"{rel_path}: {lines} lines (over 256)")

    return sizing_issues, density_issues


def check_zero_emojis():
    """Verify strict Zero-Emoji Invariant across repository."""
    issues = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for f in files:
            if f.endswith((".jpg", ".png", ".ico", ".woff", ".woff2", ".bin")):
                continue
            fpath = os.path.join(root, f)
            rel = os.path.relpath(fpath, REPO_ROOT)
            try:
                with open(fpath, "r", encoding="utf-8") as fp:
                    for lno, line in enumerate(fp, 1):
                        for ch in line:
                            cp = ord(ch)
                            if (0x1F300 <= cp <= 0x1FADF or
                                0x1F600 <= cp <= 0x1F64F or
                                0x1F680 <= cp <= 0x1F6FF or
                                0x2600 <= cp <= 0x27BF or
                                0x1F900 <= cp <= 0x1F9FF or
                                0x1FA70 <= cp <= 0x1FAFF):
                                issues.append(f"{rel}:{lno}: Prohibited emoji/symbol '{ch}' (U+{cp:04X})")
                                break
            except Exception:
                pass
    return issues


def main():
    failures = []
    print("1. Checking HTML structure and tag balance...")
    html_issues, ids, links = check_html_structure()
    if html_issues:
        for err in html_issues: print(f"  [-] {err}")
        failures.extend(html_issues)
    else:
        print("  [OK] index.html has 0 unclosed or mismatched HTML tags.")

    checks = [
        ("2. Checking local assets and internal anchors...", lambda: check_local_assets_and_anchors(ids, links), f"All {len(links)} links and assets are intact and verified."),
        ("3. Checking JavaScript syntax (node --check)...", check_js_syntax, "All JavaScript files pass node --check syntax tests."),
        ("4. Checking critical project files...", check_critical_files, "All required branding, style, script, and metadata files exist."),
        ("5. Checking Page Rules (16-256 lines) & Directory Density (<= 12 files)...", lambda: sum(check_line_sizing_and_density(), []), "All code files satisfy 16-256 lines, README.md < 25 lines, and directories <= 12 files."),
        ("6. Checking Strict Zero-Emoji Invariant...", check_zero_emojis, "Strict Zero-Emoji Invariant verified across all files."),
    ]
    for title, fn, ok_msg in checks:
        print(title)
        errs = fn()
        if errs:
            for err in errs: print(f"  [-] {err}")
            failures.extend(errs)
        else:
            print(f"  [OK] {ok_msg}")

    if failures:
        print(f"\nResult: FAILED with {len(failures)} violation(s).", file=sys.stderr)
        sys.exit(1)
    print("\nResult: All page rules, assets, syntax, and invariants PASSED.")


if __name__ == "__main__":
    main()
