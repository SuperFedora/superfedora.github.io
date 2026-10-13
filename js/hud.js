/* js/hud.js — Pop!_OS COSMIC Keybindings Matrix & CLI Simulator */
(function() {
  'use strict';

  var keysData = [
    { kbd: "Super + Left / Right", action: "Focus window in direction", cat: "window" },
    { kbd: "Super + Up / Down", action: "Focus window above / below", cat: "window" },
    { kbd: "Super + Shift + Arrows", action: "Swap window with neighbor", cat: "window" },
    { kbd: "Super + Q", action: "Close focused window", cat: "window" },
    { kbd: "Super + M", action: "Toggle window maximize / monocle", cat: "window" },
    { kbd: "Super + Space", action: "Toggle window float / tile state", cat: "window" },
    { kbd: "Super + G", action: "Toggle grouped tabbed windows", cat: "window" },
    { kbd: "Super + T", action: "Launch GPU terminal (Ghostty/Kitty)", cat: "launch" },
    { kbd: "Super + D", action: "Launch Fuzzel app menu", cat: "launch" },
    { kbd: "Super + B", action: "Launch Firefox browser", cat: "launch" },
    { kbd: "Super + E", action: "Launch Nautilus file manager", cat: "launch" },
    { kbd: "Super + Shift + Esc", action: "Launch btop resource monitor", cat: "launch" },
    { kbd: "Super + 1 .. 9", action: "Switch to workspace 1–9", cat: "workspace" },
    { kbd: "Super + Shift + 1 .. 9", action: "Move active window to workspace 1–9", cat: "workspace" },
    { kbd: "Super + Tab", action: "Switch to previous workspace", cat: "workspace" },
    { kbd: "Super + Shift + S", action: "Interactive screen area snip (slurp)", cat: "system" },
    { kbd: "Print", action: "Full desktop screenshot to clipboard", cat: "system" },
    { kbd: "Super + L", action: "Lock screen immediately (hyprlock)", cat: "system" },
    { kbd: "Super + Esc", action: "Power & session logout menu", cat: "system" },
    { kbd: "Super + Shift + I", action: "Preview IdleScreen screensaver suite", cat: "system" }
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

    document.querySelectorAll(".key-filter-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.querySelectorAll(".key-filter-btn").forEach(function(b) {
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


  // Interactive CLI Control Center
  var cliCommands = {
    "sf-doctor": {
      prompt: "sf doctor",
      output: "[OK] Host OS: Fedora 42 Workstation (x86_64)\n" +
              "[OK] Compositor: Hyprland 0.47.2 (Wayland native 144Hz)\n" +
              "[OK] Session Manager: uwsm (systemd user session bound)\n" +
              "[OK] Status Bar: Quickshell v0.2.1 online\n" +
              "[OK] Btrfs Root: /dev/nvme0n1p3 (Snapper baseline #1 verified)\n" +
              "[OK] Idle Screensaver: idlescreen v4.1.21 registered with hypridle\n" +
              "[OK] Dotfiles Integrity: Zero-symlink direct deployment intact\n\n" +
              "Result: 7/7 systems healthy. Workstation is operational."
    },
    "sf-install": {
      prompt: "sf install",
      output: "[+] SUPERFEDORA 16-BIT WORKSTATION INSTALLER // v0.2.0\n" +
              "[+] Initializing 10-module idempotent execution sequence...\n" +
              "[OK] [00-preflight] Host: Fedora 42 (x86_64) | Sudo: YES | Network: UP\n" +
              "[OK] [00-preflight] Btrfs root snapshot #1 captured: superfedora-preinstall-baseline\n" +
              "[OK] [10-repos] RPM Fusion, lionheartp/Hyprland COPR, Tailscale configured\n" +
              "[OK] [20-base] PipeWire, VA-API, mesa-va-drivers, ffmpeg installed\n" +
              "[OK] [30-session] greetd & tuigreet enabled | uwsm systemd targets bound\n" +
              "[OK] [40-desktop] Hyprland v0.47+, Quickshell, Fuzzel, JetBrainsMono deployed\n" +
              "[OK] [50-apps] Ghostty, Alacritty, Firefox, Nautilus, btop ready\n" +
              "[OK] [60-idlescreen] 48 ASCII scenes registered | hypridle 120s timeout\n" +
              "[OK] [70-dev] GCC, Rustup, Cargo-binstall, Node.js LTS, Python uv installed\n" +
              "[OK] [80-ai] Antigravity CLI, Grok CLI, MiniMax, Mistral Vibe ready\n" +
              "[OK] [90-dotfiles] Direct configs deployed to ~/.config/ | sf CLI linked\n" +
              "[DONE] Workstation installation complete in 42.1s (10/10 modules passed)."
    },
    "sf-status": {
      prompt: "sf status",
      output: "SuperFedora 16-Bit Workstation // Release 0.2.0\n" +
              "Kernel: Linux 6.13.4-200.fc42.x86_64\n" +
              "Session: hyprland-uwsm.desktop (Wayland)\n" +
              "Theme: Tokyo Night (16-bit SNES Jewel active)\n" +
              "Snapper Snapshots: 4 active (Latest: #4 pre-dnf update)\n" +
              "IdleScreen: Standby (Activation timeout: 120s)\n" +
              "Audio: PipeWire 1.2.7 (WirePlumber 0.5.8)"
    },
    "sf-rollback": {
      prompt: "sf rollback --dry-run",
      output: "[+] Querying Btrfs Snapper snapshot timeline...\n" +
              "[OK] Found immutable baseline snapshot #1 (superfedora-preinstall-baseline)\n" +
              "[OK] Target snapshot timestamp: 2026-10-13 06:14:02 UTC\n" +
              "[+] Prepared rollback target: Subvolume /@ to snapshot #1\n" +
              "[--] DRY-RUN MODE: No modifications applied to disk.\n" +
              "To execute live rollback: run 'sf rollback --confirm'"
    },
    "sf-dotfiles": {
      prompt: "sf dotfiles status",
      output: "[OK] ~/.config/hypr/hyprland.conf -> in sync\n" +
              "[OK] ~/.config/quickshell/shell.qml -> in sync\n" +
              "[OK] ~/.config/fuzzel/fuzzel.ini -> in sync\n" +
              "[OK] ~/.config/idlescreen/config.toml -> in sync\n" +
              "[OK] Managed symlinks: 0 (Strict direct file deployment enforced)\n" +
              "[OK] Backup archive: ~/.config/superfedora/backups/ (2 baselines stored)"
    },
    "sf-bindings": {
      prompt: "sf bindings --category window",
      output: "+--- POP!_OS COSMIC WINDOW SHORTCUTS -----------------------------------+\n" +
              "| Super + Left/Right     Focus tiled window in direction                |\n" +
              "| Super + Up/Down        Focus window above or below                    |\n" +
              "| Super + Shift + Arrows Swap active window with neighbor in direction  |\n" +
              "| Super + Q              Close focused window                           |\n" +
              "| Super + M              Toggle monocle fullscreen maximize             |\n" +
              "| Super + Space          Toggle floating / tiling mode                  |\n" +
              "| Super + G              Toggle grouped window tabbed container         |\n" +
              "| Super + F1             Launch live on-screen keybindings HUD          |\n" +
              "+-----------------------------------------------------------------------+"
    },
    "sf-theme": {
      prompt: "sf theme status",
      output: "Active Theme : Super Blue (01-super-blue) [dark]\n" +
              "Palettes     : 01-super-blue 02-metroid-violet 03-super-ruby 04-emerald-green\n" +
              "               05-star-gold 06-electric-cyan 07-flame-orange 08-neon-coral\n\n" +
              "[OK] Desktop Wallpaper : ~/Pictures/Wallpapers/dark/01-super-blue.png (4K)\n" +
              "[OK] Lockscreen        : ~/.config/hypr/hyprlock.conf (Unblurred 4K Hero)\n" +
              "[OK] Compositor & Bar  : Hyprland borders + Quickshell Theme.qml synced\n" +
              "[OK] Launcher & Term   : Fuzzel + Kitty (SIGUSR1 live reload) synced\n" +
              "[OK] Login & IdleScreen: tuigreet ANSI theme + superfedora screensaver active"
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

