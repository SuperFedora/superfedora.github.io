/* js/modules.js — 10 Modules Data & Interactive HUD Inspector */
(function() {
  'use strict';

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
      tags: ["Btrfs", "Snapper", "Safety Net", "Fedora 42+"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[BTRFS: BASELINE #1]", type: "hot" }, { text: "[SAFETY: 100% REVERSIBLE]", type: "cyan" }]
    },
    {
      id: "10",
      num: "10",
      slug: "10-repos",
      name: "Third-Party & COPR Repos",
      desc: "Enables curated repositories without risking upstream breakage. Configures RPM Fusion (free & nonfree), lionheartp/Hyprland COPR, phracek/PyCharm, idlescreen repo, Google Chrome, Microsoft Edge, and Tailscale.",
      packages: ["fedora-workstation-repositories", "dnf5-plugins"],
      configs: ["/etc/yum.repos.d/rpmfusion-*.repo", "/etc/yum.repos.d/idlescreen.repo"],
      verification: "dnf repolist | grep -E 'rpmfusion|copr|tailscale'",
      tags: ["RPM Fusion", "COPR", "Tailscale", "Hyprland Repo"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[REPOS: RPM FUSION+COPR]", type: "hot" }, { text: "[SAFETY: CLEAN SPLIT]", type: "cyan" }]
    },
    {
      id: "20",
      num: "20",
      slug: "20-base",
      name: "Hardware, Drivers & Media Base",
      desc: "Fills everything stripped from Fedora Minimal netinstall for daily workstation duty. Installs NetworkManager and Wi-Fi drivers, PipeWire audio server and WirePlumber, Bluetooth, tuned-ppd, VA-API hardware acceleration, full ffmpeg codecs, and writes /etc/superfedora/release system identity markers.",
      packages: ["NetworkManager-wifi", "pipewire", "wireplumber", "bluez", "tuned-ppd", "mesa-va-drivers-freeworld", "ffmpeg"],
      configs: ["/etc/superfedora/release", "/etc/profile.d/superfedora.sh"],
      verification: "wpctl status && bluetoothctl show",
      tags: ["PipeWire", "Wi-Fi", "Bluetooth", "VA-API", "FFmpeg"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[HARDWARE: ACCELERATED]", type: "hot" }, { text: "[AUDIO: LOW-LATENCY]", type: "cyan" }]
    },
    {
      id: "30",
      num: "30",
      slug: "30-session",
      name: "Greetd & UWSM Wayland Session",
      desc: "Installs greetd with the lightweight tuigreet console greeter styled to match the active 16-bit theme. Configures Hyprland to launch through uwsm (Universal Wayland Session Manager) as a first-class systemd user session.",
      packages: ["greetd", "tuigreet", "uwsm"],
      configs: ["/etc/greetd/config.toml", "/etc/tmpfiles.d/superfedora-tuigreet.conf"],
      verification: "systemctl is-enabled greetd",
      tags: ["greetd", "tuigreet", "uwsm", "systemd session"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[SESSION: UWSM SYSTEMD]", type: "hot" }, { text: "[LOGIN: 16-BIT TUIGREET]", type: "cyan" }]
    },
    {
      id: "40",
      num: "40",
      slug: "40-desktop",
      name: "Hyprland, Multi-Edge Panels & TUIs",
      desc: "High-refresh Hyprland 0.53+ compositor, Quickshell multi-edge panels (Top Bar, Intellihide Bottom Dock, Left/Right Hardware Telemetry Docks, Panel Studio, and Quake AI Drop-Down HUD), GNOME-style 16-bit hyprlock, fuzzel, and Omarchy-style Ratatui TUIs (wiremix, wlctl, bluetui).",
      packages: ["hyprland", "hypridle", "hyprlock", "hyprpaper", "quickshell", "fuzzel", "wiremix", "wlctl", "bluetui"],
      configs: ["~/.config/hypr/hyprland.conf", "~/.config/quickshell/shell.qml", "~/.config/quickshell/panels/QuakeAi.qml"],
      verification: "hyprctl version && qs ipc call panels reload",
      tags: ["Hyprland", "Quickshell", "Multi-Edge Dock", "wiremix", "wlctl", "bluetui"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[HUD: MULTI-EDGE QML]", type: "hot" }, { text: "[TUIS: WIREMIX/WLCTL/BLUETUI]", type: "cyan" }]
    },
    {
      id: "50",
      num: "50",
      slug: "50-apps",
      name: "Curated Workstation Apps",
      desc: "Fast, keyboard-driven day-to-day productivity suite. Kitty and foot GPU-accelerated terminals, Firefox with Wayland hardware video decode, GNOME Files (Nautilus), Google Chrome, Microsoft Edge, Tailscale mesh VPN, btop monitor, and fastfetch.",
      packages: ["kitty", "foot", "firefox", "nautilus", "google-chrome-stable", "microsoft-edge-stable", "tailscale", "btop", "fastfetch"],
      configs: ["~/.config/kitty/kitty.conf", "~/.config/mimeapps.list"],
      verification: "kitty -v && firefox -v && btop -v",
      tags: ["kitty", "Firefox", "Nautilus", "Tailscale", "btop"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[GPU: TERMINALS]", type: "hot" }, { text: "[NETWORK: TAILSCALE]", type: "cyan" }]
    },
    {
      id: "60",
      num: "60",
      slug: "60-idlescreen",
      name: "IdleScreen Screensaver Suite",
      desc: "Artisanal Wayland screensaver suite locked to the exclusive 16-bit SuperFedora pixel art & spotlight theme. Wired into hypridle (120s timeout) with instant stop when locking the screen via hyprlock. Zero active CPU cycles when desktop is in use.",
      packages: ["idlescreen", "idlescreen-extras"],
      configs: ["~/.config/hypr/hypridle.conf", "~/.config/idlescreen/config.toml"],
      verification: "idlescreen status && idlescreen tui",
      tags: ["IdleScreen", "16-Bit SuperFedora", "ASCII", "Zero Cycles"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[THEME: SUPERFEDORA 16-BIT]", type: "hot" }, { text: "[IDLE: ZERO-CYCLES]", type: "cyan" }]
    },
    {
      id: "70",
      num: "70",
      slug: "70-dev",
      name: "Dev Toolchain & Native Source Builder",
      desc: "Polyglot developer toolchain (GCC, CMake, Git, gh, Node.js 22, Rustup with musl target, cargo-binstall, uv) plus the Localhost Source Builder (lib/build-source.sh). When --build-from-source is selected, tunes and compiles workstation binaries with -march=native -mtune=native -flto=auto and target-cpu=native.",
      packages: ["gcc", "gcc-c++", "make", "cmake", "gh", "nodejs22-bin", "rustup", "cargo-binstall", "uv"],
      configs: ["~/.config/superfedora/hardware-flags.env", "~/.rpmmacros"],
      verification: "sf build status && rustc --version && uv --version",
      tags: ["Build from Source", "-march=native", "Rust", "Node.js", "Python uv"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[NATIVE: -march=native]", type: "hot" }, { text: "[RUST: target-cpu=native]", type: "cyan" }]
    },
    {
      id: "80",
      num: "80",
      slug: "80-ai",
      name: "AI CLI Suite & Quake Drop-Down",
      desc: "Curated terminal AI engineering agents: Antigravity CLI (agy / antigravity-cli), xAI Grok CLI, MiniMax Code, and Mistral Vibe — integrated into the Quake-style slide-down AI console on Super + ` (grave) with instant agent switching.",
      packages: ["agy (antigravity-cli)", "grok", "mcode", "vibe"],
      configs: ["~/.config/hypr/scripts/quake-ai.sh", "~/.config/quickshell/panels/QuakeAi.qml"],
      verification: "sf ai status && agy --version",
      tags: ["Quake AI (Super+`)", "Antigravity CLI", "Grok CLI", "MiniMax", "Mistral Vibe"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[QUAKE AI: SUPER+`]", type: "hot" }, { text: "[DEFAULT: ANTIGRAVITY]", type: "cyan" }]
    },
    {
      id: "90",
      num: "90",
      slug: "90-dotfiles",
      name: "Zero-Symlink Dotfiles & 16-Bit Themes",
      desc: "Deploys direct files into ~/.config/ and 16 4K 16-bit wallpapers into ~/Pictures/Wallpapers/ with automatic timestamped backups. Enforces Firefox default browser MIME handlers and provides sf theme, sf panel, sf build, and sf ai orchestrators.",
      packages: ["sf", "superfedora"],
      configs: ["~/.config/hypr/", "~/.config/quickshell/", "~/Pictures/Wallpapers/", "~/.local/bin/sf"],
      verification: "sf dotfiles --check && sf status",
      tags: ["Zero Symlinks", "16-Bit Themes", "4K Wallpapers", "sf CLI"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[DOTFILES: 0-SYMLINK]", type: "hot" }, { text: "[THEMES: 8 JEWELS X DARK/LIGHT]", type: "cyan" }]
    }
  ];

  function selectModule(id) {
    var mod = modulesData.find(function(m) { return m.id === id; }) || modulesData[0];
    document.querySelectorAll(".module-btn").forEach(function(btn) {
      btn.classList.toggle("active", btn.getAttribute("data-module-id") === mod.id);
    });

    var titleEl = document.getElementById("module-detail-title");
    var badgeEl = document.getElementById("module-detail-badge");
    var descEl = document.getElementById("module-detail-desc");
    var pkgsEl = document.getElementById("module-pkgs-list");
    var cfgsEl = document.getElementById("module-cfgs-list");
    var verEl = document.getElementById("module-ver-code");
    var tagsEl = document.getElementById("module-tags");

    if (titleEl) titleEl.textContent = mod.num + " // " + mod.name;
    if (badgeEl) badgeEl.textContent = mod.slug + ".sh";
    if (descEl) descEl.textContent = mod.desc;
    if (pkgsEl) pkgsEl.textContent = mod.packages.join(", ");
    if (cfgsEl) cfgsEl.textContent = mod.configs.join("\n");
    if (verEl) verEl.textContent = mod.verification;

    if (tagsEl) {
      tagsEl.innerHTML = "";
      mod.tags.forEach(function(tag) {
        var span = document.createElement("span");
        span.className = "module-tag";
        span.textContent = tag;
        tagsEl.appendChild(span);
      });
    }

    var statsEl = document.getElementById("module-stats-list");
    if (statsEl) {
      statsEl.innerHTML = "";
      (mod.stats || []).forEach(function(s) {
        var badge = document.createElement("span");
        badge.className = "module-stat-badge " + (s.type || "ready");
        badge.textContent = s.text;
        statsEl.appendChild(badge);
      });
    }
  }

  function initModules() {
    var navList = document.getElementById("module-nav-list");
    if (!navList) return;
    navList.innerHTML = "";

    modulesData.forEach(function(mod, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "module-btn" + (idx === 0 ? " active" : "");
      btn.setAttribute("data-module-id", mod.id);
      btn.innerHTML = '<span>' + mod.name + '</span><span class="module-num">[' + mod.num + ']</span>';
      btn.addEventListener("click", function() {
        selectModule(mod.id);
        if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(620);
      });
      navList.appendChild(btn);
    });

    document.querySelectorAll(".module-card, .module-card-clone").forEach(function(card, idx) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function() {
        var targetMod = modulesData[idx % modulesData.length];
        if (targetMod) {
          selectModule(targetMod.id);
          var hudEl = document.getElementById("modules");
          if (hudEl) hudEl.scrollIntoView({ behavior: "smooth" });
          if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(640);
        }
      });
    });

    selectModule("00");
  }

  window.ModulesHUD = {
    data: modulesData,
    select: selectModule,
    init: initModules
  };

  document.addEventListener("DOMContentLoaded", initModules);
})();
