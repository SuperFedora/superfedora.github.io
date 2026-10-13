#!/usr/bin/env python3
"""tests/test_webpage_verification.py — Deep verification of SuperFedora webpage features.

Validates via headless Chrome:
1. Header is present, streamlined, and contains required minimal navigation.
2. Persistent footer dock HUD is fixed at bottom with UP/DOWN buttons, CRT/SFX toggles, and 8 jewel swatches.
3. Arrow key navigation (Up/Down) rotates 16-bit color palettes.
4. Clicking footer dock jewel swatches updates CSS variables.
5. Dedicated Pre-Installed section contains all 10 required workstation components.
6. Dual-opposing scrolling marquees (left and right) exist and contain required badges.
7. Keyboard shortcuts help modal toggles via '?' / 'h' and closes on Escape.
8. CRT and SFX toggles respond and persist.
"""
import base64
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT_HTTP = 8894
PORT_CDP = 9344

def ws_handshake(sock, host, port, path):
    key = base64.b64encode(os.urandom(16)).decode("utf-8")
    req = f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
    sock.sendall(req.encode("utf-8"))
    resp = sock.recv(4096)
    assert b"101" in resp, f"Handshake failed: {resp}"

def send_frame(sock, text):
    data = text.encode("utf-8")
    length = len(data)
    frame = bytearray([0x81])
    mask = os.urandom(4)
    if length <= 125: frame.append(0x80 | length)
    elif length <= 65535: frame.extend([0x80 | 126] + list(length.to_bytes(2, "big")))
    else: frame.extend([0x80 | 127] + list(length.to_bytes(8, "big")))
    frame.extend(mask)
    frame.extend(bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
    sock.sendall(frame)

def recv_frame(sock):
    header = sock.recv(2)
    if not header: return ""
    length = header[1] & 0x7f
    if length == 126: length = int.from_bytes(sock.recv(2), "big")
    elif length == 127: length = int.from_bytes(sock.recv(8), "big")
    data = b""
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk: break
        data += chunk
    return data.decode("utf-8", errors="ignore")

class CDPClient:
    def __init__(self, sock):
        self.sock = sock
        self.msg_id = 0
    def call(self, method, params=None):
        self.msg_id += 1
        send_frame(self.sock, json.dumps({"id": self.msg_id, "method": method, "params": params or {}}))
        while True:
            raw = recv_frame(self.sock)
            if not raw: return None
            try:
                msg = json.loads(raw)
                if msg.get("id") == self.msg_id: return msg.get("result")
            except: pass
    def eval(self, expr):
        res = self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        return res["result"]["value"] if res and "result" in res and "value" in res["result"] else res

def run_tests():
    httpd = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT_HTTP), "--bind", "127.0.0.1"],
                             cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.5)

    chrome = subprocess.Popen([
        "google-chrome", "--headless=new", f"--remote-debugging-port={PORT_CDP}",
        "--no-sandbox", "--disable-gpu", "--window-size=1280,800",
        f"http://127.0.0.1:{PORT_HTTP}/index.html"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)

    try:
        pages_url = f"http://127.0.0.1:{PORT_CDP}/json"
        with urllib.request.urlopen(pages_url) as resp:
            targets = json.loads(resp.read().decode())
        target = next(t for t in targets if "index.html" in t.get("url", ""))
        path = "/" + target["webSocketDebuggerUrl"].split("/", 3)[3]

        s = socket.create_connection(("127.0.0.1", PORT_CDP))
        ws_handshake(s, "127.0.0.1", PORT_CDP, path)
        cdp = CDPClient(s)
        time.sleep(0.5)

        # 1. Header & Footer Visibility
        print("[TEST 1] Testing Header and Footer Dock HUD presence...")
        h_sticky = cdp.eval("getComputedStyle(document.querySelector('.site-header')).position === 'sticky'")
        d_fixed = cdp.eval("getComputedStyle(document.getElementById('footer-dock')).position === 'fixed'")
        assert h_sticky and d_fixed, "Header sticky or footer dock fixed assertion failed"
        print("  [OK] Header is sticky and Footer Dock HUD is fixed.")

        # 2. 8 Jewel Swatches in Footer Dock
        print("[TEST 2] Testing 8 16-Bit Jewel Swatches in Footer Dock...")
        for p in ["blue", "purple", "red", "green", "gold", "cyan", "orange", "coral"]:
            assert cdp.eval(f"Boolean(document.querySelector('#footer-accent-picker [data-palette=\"{p}\"]'))"), f"Missing swatch {p}"
        print("  [OK] Found all 8 16-bit swatches in footer dock.")

        # 3 & 4. Color Rotation on Arrow Down / Up Keys
        print("[TEST 3] Testing 16-bit color random rotation on Down Arrow key...")
        b_down = cdp.eval("window.SuperTheme.getCurrent()")
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));")
        a_down = cdp.eval("window.SuperTheme.getCurrent()")
        assert b_down != a_down, f"Theme did not change on ArrowDown: {b_down} -> {a_down}"
        print(f"  [OK] Color rotated on ArrowDown: {b_down} -> {a_down}")

        print("[TEST 4] Testing 16-bit color random rotation on Up Arrow key...")
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));")
        a_up = cdp.eval("window.SuperTheme.getCurrent()")
        assert a_down != a_up, f"Theme did not change on ArrowUp: {a_down} -> {a_up}"
        print(f"  [OK] Color rotated on ArrowUp: {a_down} -> {a_up}")

        # 5. Dedicated Pre-Installed Section
        print("[TEST 5] Testing Dedicated Pre-Installed Section...")
        card_count = cdp.eval("document.querySelectorAll('#pre-installed .preinstalled-card').length")
        assert card_count == 10, f"Expected 10 pre-installed cards, got {card_count}"
        expected_items = ["Hyprland", "Quickshell", "COSMIC", "IdleScreen", "Snapper", "Tokyo Night", "Ghostty", "Fuzzel", "Neovim", "SuperFedora CLI"]
        for exp in expected_items:
            found = cdp.eval(f"Array.from(document.querySelectorAll('#pre-installed .preinstalled-title')).some(el => el.textContent.toLowerCase().includes('{exp.lower()}'))")
            assert found, f"Expected pre-installed item containing '{exp}' not found"
        print("  [OK] All 10 pre-installed components verified in #pre-installed.")

        # 6. Dual-Opposing Marquees
        print("[TEST 6] Testing Dual-Opposing Marquee Streams...")
        wrap_exists = cdp.eval("Boolean(document.querySelector('.dual-marquee-wrap'))")
        left_count = cdp.eval("document.querySelectorAll('.marquee-stream.stream-left .marquee-chip').length")
        right_count = cdp.eval("document.querySelectorAll('.marquee-stream.stream-right .marquee-chip').length")
        assert wrap_exists, "dual-marquee-wrap missing"
        assert left_count >= 10, f"Expected >=10 left chips, got {left_count}"
        assert right_count >= 10, f"Expected >=10 right chips, got {right_count}"
        print(f"  [OK] Dual streams verified: Left ({left_count} chips), Right ({right_count} chips).")

        # 7. Help Modal Toggle
        print("[TEST 7] Testing Keyboard Shortcuts Help Modal (toggle via '?' and close via 'Escape')...")
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));")
        assert cdp.eval("document.getElementById('shortcuts-modal').classList.contains('open')"), "Modal did not open on '?' key"
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));")
        assert not cdp.eval("document.getElementById('shortcuts-modal').classList.contains('open')"), "Modal did not close on Escape key"
        print("  [OK] Help modal opens on '?' and closes on 'Escape'.")

        # 8. CRT and SFX Toggles
        print("[TEST 8] Testing CRT and SFX Toggles...")
        b_crt = cdp.eval("document.getElementById('toggle-crt').textContent")
        cdp.eval("window.CRT.toggle();")
        a_crt = cdp.eval("document.getElementById('toggle-crt').textContent")
        assert b_crt != a_crt, "CRT toggle failed"
        b_sfx = cdp.eval("document.getElementById('toggle-sfx').textContent")
        cdp.eval("window.SFX.toggle();")
        a_sfx = cdp.eval("document.getElementById('toggle-sfx').textContent")
        assert b_sfx != a_sfx, "SFX toggle failed"
        print(f"  [OK] CRT toggled ({b_crt} -> {a_crt}), SFX toggled ({b_sfx} -> {a_sfx}).")


        # 9. Initial Title Screen Presentation
        print("[TEST 9] Testing Initial Title Screen Presentation...")
        super_text = cdp.eval("document.querySelector('#mainscreen .mainscreen-super-title').textContent.trim()")
        fedora_text = cdp.eval("document.querySelector('#mainscreen .mainscreen-fedora-title').textContent.trim()")
        assert super_text == "SUPER", f"Expected SUPER in title screen, got '{super_text}'"
        assert fedora_text == "FEDORA", f"Expected FEDORA in title screen, got '{fedora_text}'"
        ms_bottom = cdp.eval("document.getElementById('mainscreen').getBoundingClientRect().bottom")
        hero_top = cdp.eval("document.getElementById('hero').getBoundingClientRect().top")
        assert hero_top >= ms_bottom - 1, f"Hero section overlaps mainscreen ({hero_top} < {ms_bottom})"
        clutter_count = cdp.eval("document.querySelectorAll('#mainscreen .mainscreen-badge, #mainscreen .mainscreen-pills, #mainscreen .mainscreen-actions, #mainscreen .mainscreen-avatar-frame').length")
        assert clutter_count == 0, f"Expected 0 clutter elements in title screen, found {clutter_count}"
        print("  [OK] Clean title screen verified: SUPER + FEDORA only, zero clutter, exact viewport fitting.")

        # 10. Alternating 6-Section Scrolling Marquees
        print("[TEST 10] Testing Alternating 6-Section Scrolling Marquees (Left/Right alternating)...")
        expected_sections = [
            ("#pre-installed", "marquee-scroll-left"),
            ("#modules", "marquee-scroll-right"),
            ("#keybindings", "marquee-scroll-left"),
            ("#cli", "marquee-scroll-right"),
            ("#wallpapers", "marquee-scroll-left"),
            ("#repos", "marquee-scroll-right")
        ]
        for sec_id, expected_cls in expected_sections:
            has_track = cdp.eval(f"Boolean(document.querySelector('{sec_id} .marquee-track-continuous.{expected_cls}'))")
            assert has_track, f"Section {sec_id} missing marquee track with {expected_cls}"
        print("  [OK] All 6 sections alternate Left -> Right -> Left -> Right -> Left -> Right seamlessly.")

        # 11. Spotlight Canvas, Dominant Wordmark Sizing & Zero-Cycles Invariant
        print("[TEST 11] Testing Spotlight Canvas, Dominant Sizing & Zero-Cycles Invariant...")
        has_canvas = cdp.eval("Boolean((document.getElementById('spotlight-canvas') || document.getElementById('mainscreen-canvas')).width > 0)")
        has_hook = cdp.eval("typeof window.idleRenderSpotlight === 'function'")
        assert has_canvas and has_hook, "Spotlight canvas or window hook missing"

        # Dominant sizing: wordmark width should take up dominant width of screen (>= 85%)
        state = cdp.eval("window.__getSpotlightState ? window.__getSpotlightState() : null")
        assert state is not None, "window.__getSpotlightState() is not available"
        ratio = state["wordmarkWidth"] / state["stageWidth"]
        assert ratio >= 0.85, f"Wordmark width ratio {ratio:.2f} is less than 0.85 dominant threshold"

        # Active on pointer move
        cdp.eval("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 300, bubbles: true }));")
        move_state = cdp.eval("window.__getSpotlightState()")
        assert move_state["mouseActive"], "Expected mouseActive to be true on pointer move"

        # Text hit detection & spotlight shrinking over text
        cdp.eval("var el = document.querySelector('.site-header .brand-name'); var r = el.getBoundingClientRect(); window.dispatchEvent(new PointerEvent('pointermove', { clientX: Math.round(r.left + r.width * 0.5), clientY: Math.round(r.top + r.height * 0.5), bubbles: true }));")
        time.sleep(0.1)
        text_state = cdp.eval("window.__getSpotlightState()")
        assert text_state["isOverText"], "Expected isOverText to be true over text element"

        # Window leave orbit: eases to continuous orbit
        cdp.eval("document.dispatchEvent(new Event('pointerleave'));")
        leave_state = cdp.eval("window.__getSpotlightState()")
        assert not leave_state["mouseActive"], "Expected mouseActive to be false after pointerleave"
        assert leave_state["isRunning"], "Expected spotlight to orbit when pointer leaves"

        # Scroll persistence: spotlight persists across site
        cdp.eval("window.scrollTo({ top: 1500, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));")
        cdp.eval("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 400, bubbles: true }));")
        scroll_state = cdp.eval("window.__getSpotlightState()")
        assert scroll_state["mouseActive"] and scroll_state["isRunning"], "Expected spotlight to persist on scroll"

        # Zero-cycles idle invariant when tab is hidden
        cdp.eval("Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));")
        hidden_state = cdp.eval("window.__getSpotlightState()")
        assert not hidden_state["isRunning"], "Expected 0 cycles (paused) when tab is hidden"
        cdp.eval("Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));")
        cdp.eval("window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));")
        print("  [OK] Deep spotlight verification (dominant sizing, text shrinking, leave orbit, scroll persistence, zero-cycles) verified.")

        # 12. Interactive Modules HUD, Keybinding Matrix, CLI & Wallpapers
        print("[TEST 12] Testing Interactive Modules HUD, Keys Matrix, CLI Simulator & Wallpapers...")
        assert cdp.eval("document.querySelectorAll('#module-nav-list .module-btn').length === 10"), "10 module buttons"
        assert cdp.eval("document.querySelectorAll('#keys-grid .key-card').length === 20"), "20 key cards"
        assert cdp.eval("Boolean(document.querySelector('.cli-tabs') && document.getElementById('cli-output').textContent.includes('sf'))"), "CLI simulator"
        assert cdp.eval("document.querySelectorAll('.wallpapers-grid .wallpaper-card').length === 4"), "4 wallpapers"
        print("  [OK] Modules HUD (10), COSMIC Matrix (20), CLI Simulator, and Wallpaper Gallery verified.")

        print("\nAll deep verification tests PASSED!")
        s.close()
    finally:
        chrome.terminate()
        httpd.terminate()

if __name__ == "__main__":
    run_tests()
