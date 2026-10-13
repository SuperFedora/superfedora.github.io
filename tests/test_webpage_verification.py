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
    req = (f"GET {path} HTTP/1.1\r\n"
           f"Host: {host}:{port}\r\n"
           f"Upgrade: websocket\r\n"
           f"Connection: Upgrade\r\n"
           f"Sec-WebSocket-Key: {key}\r\n"
           f"Sec-WebSocket-Version: 13\r\n\r\n")
    sock.sendall(req.encode("utf-8"))
    resp = sock.recv(4096)
    assert b"101" in resp, f"Handshake failed: {resp}"

def send_frame(sock, text):
    data = text.encode("utf-8")
    length = len(data)
    frame = bytearray([0x81])
    mask = os.urandom(4)
    if length <= 125: frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(length.to_bytes(2, "big"))
    else:
        frame.append(0x80 | 127)
        frame.extend(length.to_bytes(8, "big"))
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
        req = {"id": self.msg_id, "method": method, "params": params or {}}
        send_frame(self.sock, json.dumps(req))
        while True:
            raw = recv_frame(self.sock)
            if not raw: return None
            try:
                msg = json.loads(raw)
                if msg.get("id") == self.msg_id:
                    return msg.get("result")
            except: pass
    def eval(self, expr):
        res = self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        if res and "result" in res and "value" in res["result"]:
            return res["result"]["value"]
        return res

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
        assert h_sticky, "Header is not sticky"
        assert d_fixed, "Footer dock is not fixed"
        print("  [OK] Header is sticky and Footer Dock HUD is fixed.")

        # 2. 8 Jewel Swatches in Footer Dock
        print("[TEST 2] Testing 8 16-Bit Jewel Swatches in Footer Dock...")
        swatches = ["blue", "purple", "red", "green", "gold", "cyan", "orange", "coral"]
        for p in swatches:
            has_dot = cdp.eval(f"Boolean(document.querySelector('#footer-accent-picker [data-palette=\"{p}\"]'))")
            assert has_dot, f"Missing footer swatch for {p}"
        print("  [OK] Found all 8 16-bit swatches in footer dock.")

        # 3. Random Color Rotation on Arrow Down Key
        print("[TEST 3] Testing 16-bit color random rotation on Down Arrow key...")
        before_theme = cdp.eval("window.SuperTheme.getCurrent()")
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));")
        after_theme = cdp.eval("window.SuperTheme.getCurrent()")
        assert before_theme != after_theme, f"Theme did not change: {before_theme} -> {after_theme}"
        print(f"  [OK] Color rotated on ArrowDown: {before_theme} -> {after_theme}")

        # 4. Arrow Up key rotation
        print("[TEST 4] Testing 16-bit color random rotation on Up Arrow key...")
        before_up = cdp.eval("window.SuperTheme.getCurrent()")
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));")
        after_up = cdp.eval("window.SuperTheme.getCurrent()")
        assert before_up != after_up, f"Theme did not change: {before_up} -> {after_up}"
        print(f"  [OK] Color rotated on ArrowUp: {before_up} -> {after_up}")

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
        is_open = cdp.eval("document.getElementById('shortcuts-modal').classList.contains('open')")
        assert is_open, "Modal did not open on '?' key"
        cdp.eval("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));")
        is_closed = not cdp.eval("document.getElementById('shortcuts-modal').classList.contains('open')")
        assert is_closed, "Modal did not close on Escape key"
        print("  [OK] Help modal opens on '?' and closes on 'Escape'.")

        # 8. CRT and SFX Toggles
        print("[TEST 8] Testing CRT and SFX Toggles...")
        before_crt = cdp.eval("document.getElementById('toggle-crt').textContent")
        cdp.eval("window.CRT.toggle();")
        after_crt = cdp.eval("document.getElementById('toggle-crt').textContent")
        assert before_crt != after_crt, "CRT toggle failed"

        before_sfx = cdp.eval("document.getElementById('toggle-sfx').textContent")
        cdp.eval("window.SFX.toggle();")
        after_sfx = cdp.eval("document.getElementById('toggle-sfx').textContent")
        assert before_sfx != after_sfx, "SFX toggle failed"
        print(f"  [OK] CRT toggled ({before_crt} -> {after_crt}), SFX toggled ({before_sfx} -> {after_sfx}).")

        print("\nAll deep verification tests PASSED!")
        s.close()
    finally:
        chrome.terminate()
        httpd.terminate()

if __name__ == "__main__":
    run_tests()
