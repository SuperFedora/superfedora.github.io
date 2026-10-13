#!/usr/bin/env python3
"""tests/test_page_rules.py — Comprehensive validation test suite for superfedora.github.io.

Verifies:
1. HTML5 tag balance and well-formedness of index.html (no unclosed tags, no mismatched tags).
2. Local asset integrity: all referenced images, stylesheets, scripts, and links exist on disk.
3. Anchor integrity: all #hash links match existing element IDs.
4. JavaScript syntax validation across all scripts via node --check.
5. Critical metadata and branding files presence.
"""
import os
import subprocess
import sys
from html.parser import HTMLParser

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INDEX_PATH = os.path.join(REPO_ROOT, "index.html")


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
            attrs_dict = dict(attrs)
            if "id" in attrs_dict:
                self.ids.add(attrs_dict["id"])
            for k in ("href", "src"):
                if k in attrs_dict:
                    self.links.append((tag, k, attrs_dict[k], self.getpos()[0]))
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
                self.issues.append(
                    f"Mismatched tag: expected </{last}> (opened line {pos[0]}), got </{t}> at line {self.getpos()[0]}"
                )

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
        "index.html",
        "install.sh",
        "VERSION",
        "favicon.svg",
        "assets/branding/avatar.jpg",
        "styles/tokens.css",
        "styles/reset.css",
        "styles/typography.css",
        "styles/nav.css",
        "styles/mainscreen.css",
        "styles/hero.css",
        "styles/panels.css",
        "styles/crt.css",
        "js/audio.js",
        "js/theme.js",
        "js/crt.js",
        "js/copy.js",
        "js/hud.js",
        "js/starfield.js",
        "js/sun.js"
    ]
    issues = []
    for rel in required:
        full = os.path.join(REPO_ROOT, rel)
        if not os.path.exists(full):
            issues.append(f"Missing required file: {rel}")
        elif os.path.getsize(full) == 0:
            issues.append(f"Empty required file: {rel}")
    return issues


def main():
    failures = []

    print("1. Checking HTML structure and tag balance...")
    html_issues, ids, links = check_html_structure()
    if html_issues:
        for err in html_issues:
            print(f"  [-] {err}")
        failures.extend(html_issues)
    else:
        print("  [OK] index.html has 0 unclosed or mismatched HTML tags.")

    print("2. Checking local assets and internal anchors...")
    asset_issues = check_local_assets_and_anchors(ids, links)
    if asset_issues:
        for err in asset_issues:
            print(f"  [-] {err}")
        failures.extend(asset_issues)
    else:
        print(f"  [OK] All {len(links)} links and assets are intact and verified.")

    print("3. Checking JavaScript syntax (node --check)...")
    js_issues = check_js_syntax()
    if js_issues:
        for err in js_issues:
            print(f"  [-] {err}")
        failures.extend(js_issues)
    else:
        print("  [OK] All JavaScript files pass node --check syntax tests.")

    print("4. Checking critical project files...")
    file_issues = check_critical_files()
    if file_issues:
        for err in file_issues:
            print(f"  [-] {err}")
        failures.extend(file_issues)
    else:
        print("  [OK] All required branding, style, script, and metadata files exist.")

    if failures:
        print(f"\nResult: FAILED with {len(failures)} violation(s).", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nResult: All page rules, assets, and syntax checks PASSED.")
        sys.exit(0)


if __name__ == "__main__":
    main()
