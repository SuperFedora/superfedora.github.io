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
      card.innerHTML = '<span class="kbd-badge">' + item.kbd + '</span>' +
        '<div class="key-action-wrap">' +
          '<div class="key-action-name">' + item.action + '</div>' +
          '<span class="key-category-tag">[' + item.cat + ']</span>' +
        '</div>';
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
        document.querySelectorAll(".key-filter-btn").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeCat = btn.getAttribute("data-category") || btn.getAttribute("data-cat") || "all";
        renderKeybindings();
        if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(580);
      });
    });

    renderKeybindings();
  }

  // CLI Simulator
  var cliCommands = {
    "sf-doctor": {
      prompt: "sf doctor",
      output: "[OK] Host OS: Fedora 42 Workstation\n[OK] Compositor: Hyprland 0.47.2 (Wayland native)\n[OK] Session Manager: uwsm (systemd user session bound)\n[OK] Status Bar: Quickshell v0.2.1 online\n[OK] Btrfs Root: /dev/nvme0n1p3 (Snapper baseline #1 verified)\n[OK] Idle Screensaver: idlescreen v4.1.21 registered with hypridle\n[OK] Dotfiles Integrity: Zero-symlink direct deployment intact\n\nResult: 7/7 systems healthy. Workstation is operational."
    },
    "sf-status": {
      prompt: "sf status",
      output: "SuperFedora 16-Bit Workstation // Release 0.2.0\nKernel: Linux 6.13.4-200.fc42.x86_64\nSession: hyprland-uwsm.desktop (Wayland)\nTheme: Tokyo Night (16-bit SNES Jewel active)\nSnapper Snapshots: 4 active (Latest: #4 pre-dnf update)\nIdleScreen: Standby (Activation timeout: 120s)\nAudio: PipeWire 1.2.7 (WirePlumber 0.5.8)"
    },
    "sf-rollback": {
      prompt: "sf rollback --dry-run",
      output: "[+] Querying Btrfs Snapper snapshot timeline...\n[OK] Found immutable baseline snapshot #1 (superfedora-preinstall-baseline)\n[OK] Target snapshot timestamp: 2026-10-13 06:14:02 UTC\n[+] Prepared rollback target: Subvolume /@ to snapshot #1\n[--] DRY-RUN MODE: No modifications applied to disk.\nTo execute live rollback: run 'sf rollback --confirm'"
    },
    "sf-dotfiles": {
      prompt: "sf dotfiles status",
      output: "[OK] ~/.config/hypr/hyprland.conf -> in sync\n[OK] ~/.config/quickshell/shell.qml -> in sync\n[OK] ~/.config/fuzzel/fuzzel.ini -> in sync\n[OK] ~/.config/idlescreen/config.toml -> in sync\n[OK] Managed symlinks: 0 (Strict direct file deployment enforced)\n[OK] Backup archive: ~/.config/superfedora/backups/ (2 baselines stored)"
    }
  };

  function initCliSimulator() {
    var outputEl = document.getElementById("cli-output");
    if (!outputEl) return;

    function runCmd(key) {
      var cmd = cliCommands[key] || cliCommands["sf-doctor"];
      outputEl.textContent = "$ " + cmd.prompt + "\n\n" + cmd.output;

      document.querySelectorAll(".cli-tab-btn").forEach(function(btn) {
        var match = btn.getAttribute("data-cmd") === key;
        btn.classList.toggle("active", match);
      });
      if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(540);
    }

    document.querySelectorAll(".cli-tab-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var cmdKey = btn.getAttribute("data-cmd");
        if (cmdKey) runCmd(cmdKey);
      });
    });

    runCmd("sf-doctor");
  }

  document.addEventListener("DOMContentLoaded", function() {
    initKeybindings();
    initCliSimulator();
  });
})();
