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
    { kbd: "Super + F", action: "Launch Files (Nautilus) manager", cat: "launch" },
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
      prompt: "sf doctor",
      output: "[OK] Host OS: Fedora 44 Workstation (x86_64)\n" +
              "[OK] Compositor: Hyprland 0.53+ (Wayland native, layerrule v2)\n" +
              "[OK] Session Manager: uwsm (systemd user session bound)\n" +
              "[OK] Panels & Dock: Quickshell Multi-Edge + Quake AI (Super+`) online\n" +
              "[OK] Btrfs Root: /dev/nvme0n1p3 (Snapper baseline #1 verified)\n" +
              "[OK] IdleScreen: 16-bit superfedora theme unlocked & active\n" +
              "[OK] Dotfiles Integrity: Zero-symlink direct deployment intact\n\n" +
              "Result: 7/7 systems healthy. Workstation is operational."
    },
    "sf-install": {
      prompt: "sf install --build-from-source",
      output: "[+] SUPERFEDORA 16-BIT WORKSTATION INSTALLER // v0.5.0\n" +
              "[+] Mode: build-from-source (-march=native -mtune=native -flto=auto | target-cpu=native)\n" +
              "[OK] [00-preflight] Host: Fedora 44 (x86_64) | Sudo: YES | Baseline snapshot #1 ready\n" +
              "[OK] [10-repos] RPM Fusion, lionheartp/Hyprland COPR, IdleScreen, Tailscale configured\n" +
              "[OK] [20-base] PipeWire, VA-API, mesa-va-drivers, ffmpeg, /etc/superfedora/release\n" +
              "[OK] [30-session] greetd & tuigreet enabled | uwsm systemd targets bound\n" +
              "[OK] [40-desktop] Hyprland, Quickshell SuperDeck + Quattro Dock, wiremix, wlctl, bluetui\n" +
              "[OK] [50-apps] Kitty, Firefox, Nautilus, Tailscale, btop, fastfetch ready\n" +
              "[OK] [60-idlescreen] Exclusive 16-bit superfedora theme unlocked | 120s timeout\n" +
              "[OK] [70-dev] sf forge hardware profile generated + native source builds complete\n" +
              "[OK] [80-ai] Antigravity CLI (agy), Grok CLI, MiniMax, Mistral Vibe ready\n" +
              "[OK] [90-dotfiles] Direct configs + 16-bit SNES SFX + Boot-Guard deployed"
    },
    "sf-build": {
      prompt: "sf forge status",
      output: "SuperFedora Forge — Hardware-Tuned Source Builder\n" +
              "  Target Arch  : -march=skylake (x86_64, 8 threads, LTO=auto)\n" +
              "  SIMD / ISA   : aes avx avx2 bmi2 fma sse4_2\n" +
              "  CFLAGS       : -O3 -pipe -march=native -mtune=native -flto=auto -fno-plt\n" +
              "  RUSTFLAGS    : -C opt-level=3 -C target-cpu=native -C codegen-units=1 -C strip=symbols\n\n" +
              "  PRESET       BINARY            STATUS\n" +
              "  ripgrep      rg                [forged (skylake)]\n" +
              "  fastfetch    fastfetch         [forged (skylake)]\n" +
              "  idlescreen   idlescreen        [forged (skylake)]\n" +
              "  fd           fd                [forged (skylake)]\n" +
              "  zoxide       zoxide            [forged (skylake)]\n" +
              "  btop         btop              [forged (skylake)]"
    },
    "sf-status": {
      prompt: "sf status",
      output: "SuperFedora 16-Bit Workstation // Release 0.5.0\n" +
              "Session: hyprland-uwsm.desktop (Wayland)\n" +
              "Theme: Super Blue (01-super-blue) [mode: night, corners: square, nightlight: off]\n" +
              "Desktop: Top Bar Pocket + Quick Settings Pill | Unified SuperDeck | Quattro Dock\n" +
              "Snapper & Boot-Guard: grub-btrfs active + superfedora-boot-guard.service ready\n" +
              "16-Bit SNES Audio: sf sfx [ON] | IdleScreen: superfedora 16-bit theme\n" +
              "Audio / Net / BT TUIs: wiremix + wlctl + bluetui"
    },
    "sf-rollback": {
      prompt: "sf rollback --list",
      output: "[+] Querying Btrfs Snapper timeline & Boot-Guard status...\n" +
              "[OK] GRUB 41_snapshots-btrfs menu generator installed\n" +
              "[OK] superfedora-boot-guard.service armed (auto-rollback after 3 failed boots)\n" +
              "[OK] Found immutable baseline snapshot #1 (superfedora-preinstall-baseline)\n" +
              "To execute live rollback: run 'sf rollback --baseline' or 'sf rollback <id>'"
    },
    "sf-dotfiles": {
      prompt: "sf dotfiles --check",
      output: "In sync with SuperFedora v0.5.0\n" +
              "[OK] ~/.config/hypr/ (bindings, windows, looknfeel, hyprlock, quake-ai.sh)\n" +
              "[OK] ~/.config/quickshell/ (Bar, SuperDeck, Quattro Dock, 16-bit SNES Osd, LockScreen)\n" +
              "[OK] ~/Pictures/Wallpapers/ (16 4K dark/light 16-bit Hero wallpapers)\n" +
              "[OK] Managed symlinks: 0 (Strict direct file deployment enforced)"
    },
    "sf-bindings": {
      prompt: "sf tui banner",
      output: "SUPER FEDORA 16-BIT ENTERTAINMENT & WORKSTATION SYSTEM v0.5.0\n" +
              "Keybindings: 100% Pop!_OS COSMIC + Layout Save/Restore (Super+Alt+Home / Super+Home)\n" +
              "Two-Speed Resize: Super+R -> CTRL+HJKL (10px fine) / ALT+HJKL (80px coarse)"
    },
    "sf-theme": {
      prompt: "sf theme status",
      output: "Active Theme : Super Blue (01-super-blue) [mode: dark, corners: square, nightlight: off]\n" +
              "Palettes     : 01-super-blue..08-neon-coral snes tokyo-night catppuccin nord\n\n" +
              "[OK] Sync Targets : Hyprland, Quickshell, Fuzzel, Kitty, Ghostty, Tmux, Neovim, GTK\n" +
              "[OK] Geometry     : Square 90-deg pixel corners | Rounded 10px corners (--corners)\n" +
              "[OK] Nightlight   : wlsunset / hyprsunset 4200K warm filter (--nightlight)"
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
