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
      output: "[+] SUPERFEDORA 16-BIT WORKSTATION INSTALLER // v0.3.0\n" +
              "[+] Mode: build-from-source (-march=native -mtune=native -flto=auto | target-cpu=native)\n" +
              "[OK] [00-preflight] Host: Fedora 44 (x86_64) | Sudo: YES | Baseline snapshot #1 ready\n" +
              "[OK] [10-repos] RPM Fusion, lionheartp/Hyprland COPR, IdleScreen, Tailscale configured\n" +
              "[OK] [20-base] PipeWire, VA-API, mesa-va-drivers, ffmpeg, /etc/superfedora/release\n" +
              "[OK] [30-session] greetd & tuigreet enabled | uwsm systemd targets bound\n" +
              "[OK] [40-desktop] Hyprland, Quickshell Multi-Edge, wiremix, wlctl, bluetui ready\n" +
              "[OK] [50-apps] Kitty, Firefox, Nautilus, Tailscale, btop, fastfetch ready\n" +
              "[OK] [60-idlescreen] Exclusive 16-bit superfedora theme unlocked | 120s timeout\n" +
              "[OK] [70-dev] Localhost hardware profile generated + native source builds complete\n" +
              "[OK] [80-ai] Antigravity CLI (agy), Grok CLI, MiniMax, Mistral Vibe ready\n" +
              "[OK] [90-dotfiles] Direct configs + Quake AI (Super+`) deployed | sf CLI linked"
    },
    "sf-build": {
      prompt: "sf build status",
      output: "SuperFedora Localhost Hardware Build Profile\n" +
              "  Install Mode   : source (--build-from-source)\n" +
              "  Target Arch    : -march=native / target-cpu=native (8 threads, LTO=auto)\n" +
              "  ISA Extensions : aes avx avx2 bmi2 fma sse4_2\n" +
              "  CFLAGS         : -O3 -pipe -march=native -mtune=native -flto=auto -fno-plt\n" +
              "  RUSTFLAGS      : -C opt-level=3 -C target-cpu=native -C codegen-units=1\n\n" +
              "  COMPONENT   STATE           BINARY\n" +
              "  wlctl       [source-native] ~/.local/bin/wlctl\n" +
              "  bluetui     [source-native] ~/.local/bin/bluetui\n" +
              "  wiremix     [source-native] ~/.local/bin/wiremix\n" +
              "  fuzzel      [source-native] ~/.local/bin/fuzzel\n" +
              "  btop        [source-native] ~/.local/bin/btop"
    },
    "sf-status": {
      prompt: "sf status",
      output: "SuperFedora 16-Bit Workstation // Release 0.3.0\n" +
              "Session: hyprland-uwsm.desktop (Wayland)\n" +
              "Theme: Super Blue (01-super-blue) [dark]\n" +
              "Panels: Top Bar [ON] | Bottom Intellihide Dock [ON] | Quake AI [SUPER+`]\n" +
              "Snapper Snapshots: Baseline #1 verified (sf rollback)\n" +
              "IdleScreen: superfedora 16-bit theme (120s timeout)\n" +
              "Audio / Net / BT TUIs: wiremix + wlctl + bluetui"
    },
    "sf-rollback": {
      prompt: "sf rollback --dry-run",
      output: "[+] Querying Btrfs Snapper snapshot timeline...\n" +
              "[OK] Found immutable baseline snapshot #1 (superfedora-preinstall-baseline)\n" +
              "[+] Prepared rollback target: Subvolume /@ to snapshot #1\n" +
              "[--] DRY-RUN MODE: No modifications applied to disk.\n" +
              "To execute live rollback: run 'sf rollback'"
    },
    "sf-dotfiles": {
      prompt: "sf dotfiles --check",
      output: "In sync with SuperFedora v0.3.0\n" +
              "[OK] ~/.config/hypr/ (bindings, windows, looknfeel, hyprlock, quake-ai.sh)\n" +
              "[OK] ~/.config/quickshell/ (Bar, EdgePanel, DockApps, QuakeAi, PanelSettingsPopup)\n" +
              "[OK] ~/Pictures/Wallpapers/ (16 4K dark/light 16-bit Hero wallpapers)\n" +
              "[OK] Managed symlinks: 0 (Strict direct file deployment enforced)"
    },
    "sf-bindings": {
      prompt: "sf ai status",
      output: "Agent: Antigravity CLI (agy) (agy) | Geometry: 1280x626+320+74\n" +
              "Keybinding : Super + ` (toggle slide-down) | Super + Shift + ` (cycle agent)\n" +
              "Agents     : [1] Antigravity (agy)  [2] xAI Grok  [3] MiniMax  [4] Mistral Vibe"
    },
    "sf-theme": {
      prompt: "sf theme status",
      output: "Active Theme : Super Blue (01-super-blue) [dark]\n" +
              "Palettes     : 01-super-blue 02-metroid-violet 03-super-ruby 04-emerald-green\n" +
              "               05-star-gold 06-electric-cyan 07-flame-orange 08-neon-coral\n\n" +
              "[OK] Desktop Wallpaper : ~/Pictures/Wallpapers/dark/01-super-blue.png (4K)\n" +
              "[OK] Lockscreen        : ~/.config/hypr/hyprlock.conf (Clock-free 4K Hero)\n" +
              "[OK] Quickshell IPC    : Live color reload (zero popup) + Multi-Edge Panels"
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
