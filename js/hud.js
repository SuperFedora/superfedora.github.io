/* js/hud.js — Interactive 10 Modules HUD, Pop!_OS COSMIC Keybindings Matrix & CLI Simulator */
(function() {
  // 10 Modules Metadata
  var modulesData = [
    {
      id: "00",
      num: "00",
      slug: "00-preflight",
      name: "Preflight & Btrfs Baseline",
      desc: "Validates host OS (Fedora 42+), active internet connectivity, and wheel/sudo permissions. Sets up Snapper on the Btrfs root subvolume and takes an immutable pre-install snapshot baseline (#1) so you can rollback anytime.",
      packages: ["snapper", "btrfs-progs", "sudo", "curl"],
      configs: ["/etc/snapper/configs/root", "Btrfs snapshot #1 baseline"],
      verification: "snapper list | grep baseline",
      tags: ["Btrfs", "Snapper", "Safety Net", "Fedora 42+"]
    },
    {
      id: "10",
      num: "10",
      slug: "10-repos",
      name: "Third-Party & COPR Repos",
      desc: "Enables curated repositories without risking upstream breakage. Configures RPM Fusion (free & nonfree), lionheartp/Hyprland COPR, phracek/PyCharm, idlescreen COPR, Google Chrome, Microsoft Edge, and Tailscale.",
      packages: ["fedora-workstation-repositories", "dnf5-plugins"],
      configs: ["/etc/yum.repos.d/rpmfusion-*.repo", "/etc/yum.repos.d/_copr_lionheartp-hyprland.repo"],
      verification: "dnf repolist | grep -E 'rpmfusion|copr|tailscale'",
      tags: ["RPM Fusion", "COPR", "Tailscale", "Hyprland Repo"]
    },
    {
      id: "20",
      num: "20",
      slug: "20-base",
      name: "Hardware, Drivers & Media Base",
      desc: "Fills everything stripped from Fedora Minimal netinstall for daily workstation duty. Installs NetworkManager and Wi-Fi drivers, PipeWire audio server and WirePlumber, Bluetooth, power-profiles-daemon, VA-API hardware acceleration, full ffmpeg codecs, and core Unicode fonts.",
      packages: ["NetworkManager-wifi", "pipewire", "wireplumber", "bluez", "power-profiles-daemon", "mesa-va-drivers", "ffmpeg", "dejavu-sans-fonts"],
      configs: ["/etc/systemd/system/bluetooth.service", "/etc/pipewire/pipewire.conf"],
      verification: "wpctl status && bluetoothctl show && vainfo",
      tags: ["PipeWire", "Wi-Fi", "Bluetooth", "VA-API", "FFmpeg"]
    },
    {
      id: "30",
      num: "30",
      slug: "30-session",
      name: "Greetd & UWSM Wayland Session",
      desc: "Installs greetd with the lightweight tuigreet console greeter. Configures Hyprland to launch through uwsm (Universal Wayland Session Manager) as a first-class systemd user session, providing clean lifecycle management and environment variable synchronization.",
      packages: ["greetd", "greetd-tuigreet", "uwsm"],
      configs: ["/etc/greetd/config.toml", "/usr/share/wayland-sessions/hyprland-uwsm.desktop"],
      verification: "systemctl is-active greetd",
      tags: ["greetd", "tuigreet", "uwsm", "systemd session"]
    },
    {
      id: "40",
      num: "40",
      slug: "40-desktop",
      name: "Hyprland & Quickshell Desktop",
      desc: "The primary graphical workstation interface. High-refresh Hyprland compositor with smooth animations, Quickshell interactive status bar (workspaces, tray, battery, network, notifications), hypridle screen timeout daemon, hyprlock screen lock, hyprpaper wallpaper manager, fuzzel launcher, grim/slurp screenshots, and JetBrainsMono Nerd Font.",
      packages: ["hyprland", "hypridle", "hyprlock", "hyprpaper", "quickshell", "fuzzel", "grim", "slurp", "wl-clipboard", "jetbrains-mono-nerd-fonts"],
      configs: ["~/.config/hypr/hyprland.conf", "~/.config/quickshell/shell.qml", "~/.config/fuzzel/fuzzel.ini"],
      verification: "hyprctl version && quickshell --version",
      tags: ["Hyprland", "Quickshell", "fuzzel", "hypridle", "hyprlock"]
    },
    {
      id: "50",
      num: "50",
      slug: "50-apps",
      name: "Curated Workstation Apps",
      desc: "Fast, keyboard-driven day-to-day productivity suite. Kitty and foot GPU-accelerated terminals, Firefox with Wayland hardware video decode, GNOME Files (Nautilus) file manager, Google Chrome, Microsoft Edge, Tailscale mesh VPN, btop resource monitor, and fastfetch system summary.",
      packages: ["kitty", "foot", "firefox", "nautilus", "google-chrome-stable", "microsoft-edge-stable", "tailscale", "btop", "fastfetch"],
      configs: ["~/.config/kitty/kitty.conf", "~/.config/foot/foot.ini", "~/.config/mimeapps.list"],
      verification: "kitty -v && firefox -v && btop -v",
      tags: ["kitty", "Firefox", "Nautilus", "Tailscale", "btop"]
    },
    {
      id: "60",
      num: "60",
      slug: "60-idlescreen",
      name: "IdleScreen Screensaver Suite",
      desc: "Artisanal Wayland screensaver suite with 48 in-tree ASCII scenes and host OS/DE/Kernel tri-rotation. Automatically wired into hypridle to launch after 2 minutes of system idle time. Zero CPU cycles drawn while your desktop is active.",
      packages: ["idlescreen", "idlescreen-themes"],
      configs: ["~/.config/hypr/conf/hypridle.conf", "~/.config/idlescreen/config.toml"],
      verification: "idlescreen status && idlescreen tui",
      tags: ["IdleScreen", "Wayland Screensaver", "ASCII", "Zero Cycles"]
    },
    {
      id: "70",
      num: "70",
      slug: "70-dev",
      name: "Developer Toolchain & Rust",
      desc: "Modern development environment out of the box. GCC compiler toolchain, Make, CMake, Git, GitHub CLI (gh), Node.js LTS, Rustup toolchain manager with musl target, cargo-binstall, cargo-deb, cargo-generate-rpm, and uv ultra-fast Python package runner.",
      packages: ["gcc", "make", "cmake", "git", "gh", "nodejs", "rustup", "uv"],
      configs: ["~/.cargo/env", "~/.rustup/"],
      verification: "rustc --version && cargo --version && node --version && uv --version",
      tags: ["Rust", "Node.js", "Python uv", "GCC", "GitHub CLI"]
    },
    {
      id: "80",
      num: "80",
      slug: "80-ai",
      name: "AI Engineer CLI Suite",
      desc: "A curated suite of modern AI terminal engineering tools ready for coding and automation: Antigravity CLI, xAI Grok CLI, MiniMax Code, and Mistral Vibe.",
      packages: ["antigravity-cli", "grok-cli", "minimax-code", "mistral-vibe"],
      configs: ["~/.local/bin/antigravity", "~/.config/antigravity/"],
      verification: "antigravity --version",
      tags: ["Antigravity", "xAI Grok", "MiniMax", "Mistral"]
    },
    {
      id: "90",
      num: "90",
      slug: "90-dotfiles",
      name: "Tokyo Night Dotfiles & Ergonomics",
      desc: "Deploy hand-tuned configuration files for all desktop components using the cohesive Tokyo Night color palette. Manages default browser, file associations, touch gestures, and keybinding bindings with built-in backup and drift detection.",
      packages: ["xdg-user-dirs", "papirus-icon-theme"],
      configs: ["~/.config/hypr/", "~/.config/quickshell/", "~/.config/kitty/", "~/.config/fuzzel/"],
      verification: "superfedora dotfiles --check",
      tags: ["Tokyo Night", "COSMIC Keys", "Dotfiles", "Drift Check"]
    }
  ];

  // Pop!_OS COSMIC Keybinding Matrix
  var keybindings = [
    // Session
    { keys: "Super + Esc", action: "Lock screen (hyprlock)", category: "session" },
    { keys: "Super + Shift + Esc", action: "Log out / Power menu", category: "session" },
    { keys: "Super + Alt + Esc", action: "Exit Hyprland session", category: "session" },
    { keys: "Super + Ctrl + Esc", action: "Reload configuration", category: "session" },

    // Window Focus
    { keys: "Super + ← / → / ↑ / ↓", action: "Move focus directional", category: "focus" },
    { keys: "Super + H / J / K / L", action: "Move focus (Vim keys)", category: "focus" },
    { keys: "Super + U / I", action: "Focus previous / next window", category: "focus" },

    // Window Move & Stacking
    { keys: "Super + Shift + ←/→/↑/↓", action: "Move window (joins/leaves stack)", category: "window" },
    { keys: "Super + Shift + H/J/K/L", action: "Move window (Vim directions)", category: "window" },
    { keys: "Super + S", action: "Toggle stacking mode (COSMIC style)", category: "window" },
    { keys: "Super + G", action: "Toggle floating / tiled", category: "window" },
    { keys: "Super + M", action: "Maximize window toggle", category: "window" },
    { keys: "Super + Q", action: "Close active window", category: "window" },
    { keys: "Super + R", action: "Enter resize mode (Esc to exit)", category: "window" },

    // Workspaces
    { keys: "Super + 1–9", action: "Switch to workspace 1–9", category: "workspaces" },
    { keys: "Super + Shift + 1–9", action: "Move active window to workspace 1–9", category: "workspaces" },
    { keys: "Super + Ctrl + ← / →", action: "Switch to prev / next workspace", category: "workspaces" },
    { keys: "Super + Tab", action: "Switch to previous workspace", category: "workspaces" },

    // App Launchers
    { keys: "Super + T", action: "Launch Kitty terminal", category: "apps" },
    { keys: "Super + B", action: "Launch default browser (Firefox)", category: "apps" },
    { keys: "Super + F", action: "Launch Files (Nautilus)", category: "apps" },
    { keys: "Super + /", action: "Open Fuzzel application launcher", category: "apps" },
    { keys: "Tap Super", action: "Toggle application launcher", category: "apps" },
    { keys: "Super + P", action: "Launch PyCharm IDE", category: "apps" },
    { keys: "Super + K", action: "Trigger IdleScreen screensaver immediately", category: "apps" },
    { keys: "Super + V", action: "Clipboard history manager", category: "apps" },
    { keys: "Super + F1", action: "Interactive searchable keybindings HUD", category: "apps" },

    // Screenshots & Media
    { keys: "Print", action: "Screenshot area to clipboard (grim/slurp)", category: "media" },
    { keys: "Super + Print", action: "Screenshot entire screen", category: "media" },
    { keys: "Shift + Print", action: "Record selected region", category: "media" },
    { keys: "XF86AudioRaiseVolume", action: "Volume Up 5%", category: "media" },
    { keys: "XF86AudioLowerVolume", action: "Volume Down 5%", category: "media" },
    { keys: "XF86AudioMute", action: "Mute / Unmute audio", category: "media" },
    { keys: "XF86MonBrightnessUp", action: "Increase screen brightness", category: "media" },
    { keys: "XF86MonBrightnessDown", action: "Decrease screen brightness", category: "media" }
  ];

  // CLI Outputs
  var cliOutputs = {
    status: `user@superfedora:~$ sf status
SuperFedora 0.1.0 (x86_64) on Fedora Linux 42
Checking system components:
  \x1b[32m[OK]\x1b[0m 00 preflight:   btrfs root subvolume, snapper initialized (snapshot #1 baseline)
  \x1b[32m[OK]\x1b[0m 10 repos:       RPM Fusion (free & nonfree), lionheartp/Hyprland, tailscale
  \x1b[32m[OK]\x1b[0m 20 base:        pipewire, wireplumber, bluetooth, mesa-va-drivers, ffmpeg
  \x1b[32m[OK]\x1b[0m 30 session:     greetd 0.10, tuigreet, uwsm session orchestrator
  \x1b[32m[OK]\x1b[0m 40 desktop:     Hyprland 0.47, hypridle, hyprlock, quickshell, fuzzel
  \x1b[32m[OK]\x1b[0m 50 apps:        kitty, foot, firefox, nautilus, tailscale, btop, fastfetch
  \x1b[32m[OK]\x1b[0m 60 idlescreen:  IdleScreen 4.1.21 Wayland daemon online (screensaver @ 2m)
  \x1b[32m[OK]\x1b[0m 70 dev:         gcc 15, rustup (stable-x86_64), cargo-binstall, nodejs 22, uv 0.6
  \x1b[32m[OK]\x1b[0m 80 ai:          antigravity CLI, grok CLI, minimax-code, mistral-vibe
  \x1b[32m[OK]\x1b[0m 90 dotfiles:    14 config files deployed, 0 drift detected

\x1b[36mStatus:\x1b[0m All components verified. System is 100% SuperFedora.`,

    install: `user@superfedora:~$ sf install
SuperFedora 0.1.0 — Running installer pipeline...
[00/90] Preflight checks passed. Baseline Btrfs snapshot created (#1).
[10/90] Enabling RPM Fusion & lionheartp/Hyprland COPR repos... Done.
[20/90] Installing hardware drivers, PipeWire, and ffmpeg codecs... Done.
[30/90] Configuring greetd + tuigreet + uwsm session... Done.
[40/90] Installing Hyprland, Quickshell status bar & JetBrainsMono... Done.
[50/90] Installing Kitty, Firefox, Files & Tailscale... Done.
[60/90] Configuring IdleScreen screensaver in hypridle... Done.
[70/90] Setting up GCC, Node.js, Rustup and Python uv... Done.
[80/90] Installing AI engineering CLI tools... Done.
[90/90] Deploying Tokyo Night desktop dotfiles & COSMIC keybindings... Done.

\x1b[32m[OK] SuperFedora install complete!\x1b[0m Reboot to start your 16-bit workstation.`,

    update: `user@superfedora:~$ sf update
Fetching latest SuperFedora release manifest from GitHub...
Current: v0.1.0  |  Remote: v0.1.0 (Up to date)
Running idempotent verification scan...
Checking packages... all 142 packages present.
Checking dotfiles... all configs up to date.
No changes required. Workstation is pristine.`,

    dotfiles: `user@superfedora:~$ sf dotfiles --check
Scanning dotfiles in ~/.config against SuperFedora manifests:
  [OK] ~/.config/hypr/hyprland.conf           (in sync)
  [OK] ~/.config/hypr/conf/bindings.conf      (in sync)
  [OK] ~/.config/hypr/conf/hypridle.conf      (in sync)
  [OK] ~/.config/quickshell/shell.qml         (in sync)
  [OK] ~/.config/kitty/kitty.conf             (in sync)
  [OK] ~/.config/fuzzel/fuzzel.ini            (in sync)
  [OK] ~/.config/mimeapps.list                (in sync)

0 local modifications, 0 drifts detected. Everything in sync.`,

    rollback: `user@superfedora:~$ sf rollback
SuperFedora Btrfs Snapshot Rollback Utility
Discovered baseline snapshots created by SuperFedora:
  ID  | Date                     | Type   | Description
  ----+--------------------------+--------+-----------------------------------
  #1  | 2026-10-13 14:02:18 UTC | single | superfedora-preinstall-baseline

Reverting root subvolume to Snapshot #1 will restore Fedora to its pre-install state.
Target snapshot verified. System is ready to roll back upon confirmation.`
  };

  // Setup 10 Modules HUD
  function setupModulesHud() {
    var navList = document.getElementById("module-nav-list");
    var detailBox = document.getElementById("module-detail-box");
    if (!navList || !detailBox) return;

    navList.innerHTML = "";
    modulesData.forEach(function(m, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "module-btn" + (idx === 0 ? " active" : "");
      btn.setAttribute("data-module-id", m.id);
      btn.innerHTML = '<span>' + m.slug + '</span><span class="module-num">[' + m.num + ']</span>';

      btn.addEventListener("click", function() {
        document.querySelectorAll(".module-btn").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderModuleDetail(m);
        if (window.SFX) window.SFX.playBlip(580);
      });

      navList.appendChild(btn);
    });

    renderModuleDetail(modulesData[0]);
  }

  function renderModuleDetail(m) {
    var box = document.getElementById("module-detail-box");
    if (!box) return;

    var pkgsHtml = m.packages.map(function(p) { return '<span class="module-tag">' + p + '</span>'; }).join("");
    var tagsHtml = m.tags.map(function(t) { return '<span class="module-tag text-jewel">' + t + '</span>'; }).join("");
    var configsHtml = m.configs.map(function(c) { return '<li><code>' + c + '</code></li>'; }).join("");

    box.innerHTML = `
      <div class="module-detail-header">
        <div class="module-detail-title">
          <span>${m.name}</span>
          <span class="module-detail-badge">MODULE ${m.num}</span>
        </div>
        <p class="module-detail-desc">${m.desc}</p>
        <div class="module-tag-cloud" style="margin-top: 10px;">${tagsHtml}</div>
      </div>
      <div class="module-detail-grid">
        <div class="module-spec-card">
          <h4>[PACKAGES] Key Packages Installed</h4>
          <div class="module-tag-cloud">${pkgsHtml}</div>
        </div>
        <div class="module-spec-card">
          <h4>[CONFIG] Managed Files &amp; Configurations</h4>
          <ul style="font-size: 13px; line-height: 1.6; display: flex; flex-direction: column; gap: 4px;">
            ${configsHtml}
          </ul>
        </div>
      </div>
      <div class="module-spec-card" style="margin-top: 16px;">
        <h4>[VERIFY] Verification Command</h4>
        <pre><code>${m.verification}</code></pre>
      </div>
    `;
  }

  // Setup Keybindings Matrix
  function setupKeybindings() {
    var grid = document.getElementById("keys-grid");
    var searchInput = document.getElementById("key-search-input");
    var filterBtns = document.querySelectorAll(".key-filter-btn");
    if (!grid) return;

    var currentCategory = "all";
    var currentQuery = "";

    function renderKeys() {
      grid.innerHTML = "";
      var filtered = keybindings.filter(function(item) {
        var matchCat = currentCategory === "all" || item.category === currentCategory;
        var matchText = true;
        if (currentQuery) {
          var q = currentQuery.toLowerCase();
          matchText = item.keys.toLowerCase().includes(q) || item.action.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        }
        return matchCat && matchText;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="padding: 24px; color: var(--text-dim); font-family: var(--font-pixel-sub); font-size: 12px;">No matching keybindings found.</div>';
        return;
      }

      filtered.forEach(function(item) {
        var card = document.createElement("div");
        card.className = "key-card";
        card.innerHTML = `
          <kbd class="kbd-badge">${item.keys}</kbd>
          <div class="key-action-wrap">
            <div class="key-action-name">${item.action}</div>
            <div class="key-category-tag">${item.category}</div>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function(e) {
        currentQuery = e.target.value.trim();
        renderKeys();
      });
    }

    filterBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        filterBtns.forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentCategory = btn.getAttribute("data-category");
        renderKeys();
        if (window.SFX) window.SFX.playBlip(620);
      });
    });

    renderKeys();
  }

  // Setup CLI Terminal Simulator
  function setupCliSimulator() {
    var outputEl = document.getElementById("cli-output");
    var tabBtns = document.querySelectorAll(".cli-tab-btn");
    if (!outputEl) return;

    function renderOutput(cmdKey) {
      var raw = cliOutputs[cmdKey] || "";
      // Convert ANSI colors to HTML spans
      var html = raw
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\x1b\[32m/g, '<span class="cli-success">')
        .replace(/\x1b\[36m/g, '<span class="cli-highlight">')
        .replace(/\x1b\[0m/g, '</span>');

      outputEl.innerHTML = html;
    }

    tabBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        tabBtns.forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var cmd = btn.getAttribute("data-cmd");
        renderOutput(cmd);
        if (window.SFX) window.SFX.playBlip(540);
      });
    });

    renderOutput("status");
  }

  // Setup Mobile Nav Toggle
  function setupMobileNav() {
    var btn = document.getElementById("mobile-toggle");
    var drawer = document.getElementById("mobile-drawer");
    if (!btn || !drawer) return;

    btn.addEventListener("click", function() {
      drawer.classList.toggle("open");
      if (window.SFX) window.SFX.playBlip(480);
    });

    drawer.querySelectorAll("a").forEach(function(link) {
      link.addEventListener("click", function() {
        drawer.classList.remove("open");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    setupModulesHud();
    setupKeybindings();
    setupCliSimulator();
    setupMobileNav();
  });
})();
