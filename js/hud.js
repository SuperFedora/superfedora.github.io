/* js/hud.js — Pop!_OS COSMIC Keybindings Matrix & CLI Simulator */
(function() {
  'use strict';

  var keysData = [
    { kbd: "Super + Left / Right", action: "Focus window in direction (stack-aware)", cat: "window" },
    { kbd: "Super + Up / Down", action: "Focus window above / below", cat: "window" },
    { kbd: "Super + Shift + Arrows", action: "Move / swap window or join stack", cat: "window" },
    { kbd: "Super + Q", action: "Close focused window", cat: "window" },
    { kbd: "Super + M", action: "Toggle window maximize / monocle", cat: "window" },
    { kbd: "Super + G", action: "Toggle window float / tile state", cat: "window" },
    { kbd: "Super + S", action: "Toggle grouped tabbed windows", cat: "window" },
    { kbd: "Super + ` (Grave)", action: "Quake AI drop-down console (Antigravity / agy)", cat: "launch" },
    { kbd: "Super + T", action: "Launch GPU terminal (Kitty)", cat: "launch" },
    { kbd: "Super + A / Super", action: "Launch Fuzzel app library", cat: "launch" },
    { kbd: "Super + B", action: "Launch Firefox browser", cat: "launch" },
    { kbd: "Super + E / Super + F", action: "Launch Yazi file manager", cat: "launch" },
    { kbd: "Super + 1 .. 9", action: "Switch to workspace 1-9", cat: "workspace" },
    { kbd: "Super + Ctrl + Left/Right", action: "Previous / next occupied workspace (r-1 / r+1)", cat: "workspace" },
    { kbd: "Super + W", action: "Workspace & window overview picker", cat: "workspace" },
    { kbd: "Super + Ctrl + Space", action: "Cycle 16-bit SNES jewel theme palette", cat: "system" },
    { kbd: "Super + Ctrl + A / W / B", action: "Audio (wiremix) / Wi-Fi (wlctl) / Bluetooth (bluetui)", cat: "system" },
    { kbd: "Super + Escape", action: "Lock screen immediately (16-bit hyprlock)", cat: "system" },
    { kbd: "Super + Shift + Escape", action: "Power & session logout menu", cat: "system" },
    { kbd: "Super + Shift + I", action: "Start 16-bit SuperFedora IdleScreen now", cat: "system" }
  ];

  var activeCat = "all";
  var searchFilter = "";

  function renderKeybindings() {
    var grid = document.getElementById("keys-grid");
    if (!grid) return;
    grid.innerHTML = "";

    var filtered = keysData.filter(function(item) {
      var matchesCat = (activeCat === "all") || (item.cat === activeCat);
      var text = (item.kbd + " " + item.action + " " + item.cat).toLowerCase();
      var matchesSearch = !searchFilter || text.indexOf(searchFilter) !== -1;
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-dim);font-family:var(--font-mono);padding:20px;grid-column:1/-1;text-align:center;">[--] No matching keybindings found.</div>';
      return;
    }

    filtered.forEach(function(item) {
      var card = document.createElement("div");
      card.className = "key-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.innerHTML = '<span class="kbd-badge">' + item.kbd + '</span>' +
        '<div class="key-action-wrap">' +
          '<div class="key-action-name">' + item.action + '</div>' +
          '<span class="key-category-tag">[' + item.cat + ']</span>' +
        '</div>';
      function triggerCard() {
        if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(720);
        card.classList.add("key-card-pulse");
        setTimeout(function() { card.classList.remove("key-card-pulse"); }, 200);
      }
      card.addEventListener("click", triggerCard);
      card.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerCard();
        }
      });
      grid.appendChild(card);
    });
  }

  function initKeybindings() {
    var searchInput = document.getElementById("key-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function(e) {
        searchFilter = (e.target.value || "").trim().toLowerCase();
        renderKeybindings();
      });
    }

    document.querySelectorAll("#keybindings .key-filter-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.querySelectorAll("#keybindings .key-filter-btn").forEach(function(b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        activeCat = btn.getAttribute("data-category") || btn.getAttribute("data-cat") || "all";
        renderKeybindings();
        if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(580);
      });
    });

    renderKeybindings();
  }

  var cliCommands = {
    "sf-doctor": {
      prompt: "superfedora doctor (alias: sf doctor)",
      output: "[OK] Host OS: Fedora 44 Workstation (x86_64) // SELinux: Enforcing\n" +
              "[OK] Compositor: Hyprland 0.53+ (Wayland native, layerrule v2)\n" +
              "[OK] Session Manager: uwsm + superfedora-session.target (systemd --user bound)\n" +
              "[OK] Panels & Dock: supershell + supernotify (10 animated Cast Comms)\n" +
              "[OK] Quake AI & Harness: superagent + OpenClaw + sf-ollama (Super+`) online\n" +
              "[OK] Btrfs Root: /dev/nvme0n1p3 (Snapper baseline #1 + fstrim/oomd active)\n" +
              "[OK] Theme & Audio: supertheme (16 rainbow palettes + 16-bit WAV SFX) active\n\n" +
              "Result: 7/7 systems healthy. Workstation is operational."
    },
    "sf-install": {
      prompt: "superfedora install --build-from-source",
      output: "[+] SUPERFEDORA 16-BIT WORKSTATION INSTALLER // v0.10.1\n" +
              "[+] Mode: build-from-source (-march=native -mtune=native -flto=auto | target-cpu=native)\n" +
              "[OK] [00-preflight] Host: Fedora 44 (x86_64) | SELinux: Enforcing | PackageKit 30s | Baseline #1\n" +
              "[OK] [10-repos] RPM Fusion, lionheartp/Hyprland COPR, IdleScreen, Tailscale configured\n" +
              "[OK] [20-base] VA-API hardware codecs, Firefox DMABUF, PipeWire, zram-generator, systemd-oomd\n" +
              "[OK] [30-session] greetd & tuigreet enabled | Polkit rules | uwsm + superlock bound\n" +
              "[OK] [40-desktop] Hyprland (VFR + direct_scanout), supershell, supertheme, supernotify\n" +
              "[OK] [50-apps] LibreOffice, Yazi, Zathura, MPV, Helix, Bazaar/Bazarr, btop, fastfetch ready\n" +
              "[OK] [60-idlescreen] Exclusive 16-bit superfedora theme unlocked | 120s timeout\n" +
              "[OK] [70-dev] superforge 2-tier binary cache + 37 recipes.toml native source builds complete\n" +
              "[OK] [80-ai] superagent watchdog, OpenClaw, sf-ollama, Antigravity (agy), Grok, MiniMax, Vibe\n" +
              "[OK] [90-dotfiles] Direct configs + XDG MIME associations + 32 4K wallpapers deployed"
    },
    "sf-build": {
      prompt: "superforge status",
      output: "SuperForge v0.5.1 — Native Rust 1.99 2-Tier Binary Cache & Source Compiler\n" +
              "  Target Arch  : -march=native (x86_64, LTO=thin, target-cpu=native)\n" +
              "  Stamp Store  : ~/.local/share/superfedora/forge/stamps/<name>.stamp + forge.json\n" +
              "  SHA Auditor  : superforge check-updates (git ls-remote <repo> HEAD diff)\n" +
              "  RUSTFLAGS    : -C opt-level=3 -C target-cpu=native -C codegen-units=1 -C strip=symbols\n\n" +
              "  PRESET       BINARY            STATUS\n" +
              "  superfedora  superfedora (sf)  [FORGED]\n" +
              "  superforge   superforge        [FORGED]\n" +
              "  yazi         yazi              [FORGED]\n" +
              "  zathura      zathura           [FORGED]\n" +
              "  helix        hx                [FORGED]\n" +
              "  oculante     oculante          [FORGED]\n" +
              "  satty        satty             [FORGED]\n" +
              "  wl-screenrec wl-screenrec      [FORGED]\n" +
              "  mpv          mpv               [FORGED]\n" +
              "  fend         fend              [FORGED]\n" +
              "  bazarr       bazarr            [FORGED]"
    },
    "sf-status": {
      prompt: "superfedora status",
      output: "SuperFedora 16-Bit Workstation // Release 0.9.0 (Rust 1.99 Native Engine)\n" +
              "Session: hyprland-uwsm.desktop (VFR + Direct Scanout) via superfedora-session.target\n" +
              "Workstation Mode: BALANCED (superfedora mode [stealth|balanced|forge|arcade])\n" +
              "Hardware Video: VA-API + Firefox Zero-Copy DMABUF (superfedora hardware optimize)\n" +
              "Shell & Overlay: superbar (--stream-json / hud) + supernotify (overlay / 10 Cast Specialists)\n" +
              "Time-Machine: superfedora snapshot [list|diff|create|restore] + DNF5 auto-hooks\n" +
              "Declarative Clone: superfedora export / import ~/.config/superfedora/workstation.toml"
    },
    "sf-rollback": {
      prompt: "superfedora snapshot list",
      output: "[+] Querying Btrfs Time-Machine Vault & DNF5 superfedora-snapper.actions...\n" +
              "[OK] DNF5 Auto-Hook: /etc/dnf/libdnf5-plugins/actions.d/superfedora-snapper.actions\n" +
              "[OK] GRUB 41_snapshots-btrfs menu generator + superfedora-boot-guard.service armed\n" +
              "[OK] Found immutable baseline snapshot #1 (superfedora-preinstall-baseline)\n" +
              "Run 'superfedora snapshot diff 1 0' or 'superfedora snapshot restore 1'"
    },
    "sf-dotfiles": {
      prompt: "superfedora dotfiles --check",
      output: "In sync with SuperFedora v0.9.0\n" +
              "[OK] ~/.local/bin/ (superfedora, sf -> superfedora, supertheme, superforge, superdock, superbar, supersettings, supernotify, superlock, superagent)\n" +
              "[OK] ~/.config/systemd/user/ (superfedora-session.target, supershell, superagent, idlescreen, supertheme-sun.timer, superforge-check.timer)\n" +
              "[OK] ~/.config/hypr/ (bindings, windows, looknfeel [vfr=true, direct_scanout=true], hyprlock, quake-ai.sh)\n" +
              "[OK] ~/.config/quickshell/ (Bar, SuperDeck, Quattro Dock, 16-bit SNES Osd, LockScreen)\n" +
              "[OK] ~/Pictures/Wallpapers/ (32 4K dark/light 16-bit Rainbow wallpapers: 01-crimson..16-fuchsia)"
    },
    "sf-bindings": {
      prompt: "superagent watchdog",
      output: "SuperAgent v0.3.0 — Zero-Token Workstation Telemetry & Anomaly Watchdog\n" +
              "[OK] [SYS MEDIC]   CPU/NVMe Thermals & Battery Health nominal (BTRFS // HEALER)\n" +
              "[OK] [SEC ALERT]   SELinux: Enforcing | Polkit Guard active (POLKIT // GUARD)\n" +
              "[OK] [NAVIGATOR]   Default Route & Tailscale/WireGuard tunnel healthy (NET // TAILSCALE)\n" +
              "[OK] [COMMANDER]   0 failed systemd system/user units (FLEET // OPS)\n" +
              "[OK] [AI AGENT]    agy (Antigravity CLI) + sf-ollama ready (Super + ` Grave)"
    },
    "sf-theme": {
      prompt: "supertheme status",
      output: "Active Theme : Cobalt Blue (12-cobalt) [mode: dark, corners: square, nightlight: off]\n" +
              "Palettes (16): 01-crimson 02-scarlet 03-ember 04-amber 05-topaz 06-citrine 07-peridot 08-emerald\n" +
              "               09-verdant 10-lagoon 11-glacier 12-cobalt 13-indigo 14-violet 15-orchid 16-fuchsia\n\n" +
              "[OK] Sync Targets : Hyprland, Quickshell, Fuzzel, Kitty, Ghostty, Tmux, Neovim, GTK, OpenRGB\n" +
              "[OK] Geometry     : Square 90-deg pixel corners | Rounded 10px corners (supertheme corners toggle)\n" +
              "[OK] Audio & Cast : 6 16-bit PCM WAV cues + 10 SVG cast portraits synced"
    }
  };

  function initCliSimulator() {
    var outputEl = document.getElementById("cli-output");
    if (!outputEl) return;
    var activeCmdKey = "sf-doctor";

    function runCmd(key) {
      activeCmdKey = key;
      var cmd = cliCommands[key] || cliCommands["sf-doctor"];
      outputEl.textContent = "$ " + cmd.prompt + "\n\n" + cmd.output;

      document.querySelectorAll(".cli-tab-btn").forEach(function(btn) {
        var match = btn.getAttribute("data-cmd") === key;
        btn.classList.toggle("active", match);
        btn.setAttribute("aria-selected", match ? "true" : "false");
      });
      if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(540);
    }

    document.querySelectorAll(".cli-tab-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var cmdKey = btn.getAttribute("data-cmd");
        if (cmdKey) runCmd(cmdKey);
      });
    });

    var copyBtn = document.getElementById("cli-copy-cmd");
    if (copyBtn) {
      copyBtn.addEventListener("click", function() {
        var cmd = cliCommands[activeCmdKey] || cliCommands["sf-doctor"];
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd.prompt).then(function() {
            copyBtn.textContent = "[ COPIED! ]";
            if (window.SFX && window.SFX.playSuccess) window.SFX.playSuccess();
            setTimeout(function() { copyBtn.textContent = "[ COPY COMMAND ]"; }, 1500);
          }).catch(function() {});
        }
      });
    }

    runCmd("sf-doctor");
  }

  document.addEventListener("DOMContentLoaded", function() {
    initKeybindings();
    initCliSimulator();
  });
})();
