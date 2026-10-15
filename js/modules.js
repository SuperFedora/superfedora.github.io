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
      name: "Hyprland, SuperShell & SuperTheme",
      desc: "High-refresh Hyprland 0.53+ compositor, native Rust supershell suite (superdock, superbar, supersettings, superlock), standalone supernotify (10 animated 16-bit Cast specialists + stage banners), native Rust supertheme (16-color rainbow palette + 16-bit WAV SFX), Quickshell multi-edge QML panels, fuzzel, and Ratatui TUIs (wiremix, wlctl, bluetui).",
      packages: ["hyprland", "hypridle", "hyprlock", "hyprpaper", "quickshell", "supertheme", "superdock", "superbar", "supersettings", "supernotify", "superlock", "fuzzel", "wiremix", "wlctl", "bluetui"],
      configs: ["~/.config/hypr/hyprland.conf", "~/.config/quickshell/shell.qml", "~/.config/quickshell/panels/QuakeAi.qml"],
      verification: "supertheme status && superdock status && hyprctl version",
      tags: ["Hyprland", "Quickshell", "supertheme", "supershell", "supernotify", "wiremix", "wlctl", "bluetui"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[SHELL: SUPERSHELL + QML]", type: "hot" }, { text: "[THEME: SUPERTHEME 16-COLOR]", type: "cyan" }]
    },
    {
      id: "50",
      num: "50",
      slug: "50-apps",
      name: "DE-Independent Workstation Apps",
      desc: "100% DE-independent productivity suite plus LibreOffice (Writer, Calc, Impress). Kitty and foot GPU terminals, Firefox with Wayland hardware video decode, Yazi file manager, Zathura PDF/EPUB viewer, imv/oculante image viewers, MPV, Helix, Bazaar Flatpak store, Bazarr subtitle manager, Tailscale, btop, and fastfetch.",
      packages: ["libreoffice-writer", "libreoffice-calc", "libreoffice-impress", "yazi", "zathura", "imv", "oculante", "mpv", "helix", "bazaar", "bazarr", "kitty", "firefox", "tailscale", "btop", "fastfetch"],
      configs: ["~/.config/kitty/kitty.conf", "~/.config/mimeapps.list", "~/.local/share/applications/yazi.desktop"],
      verification: "superforge status && yazi --version && libreoffice --version",
      tags: ["LibreOffice", "Yazi", "Zathura", "MPV", "Helix", "Bazaar", "Bazarr", "btop"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[SUITE: DE-INDEPENDENT]", type: "hot" }, { text: "[OFFICE: LIBREOFFICE]", type: "cyan" }]
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
      name: "Dev Toolchain & SuperForge Compiler",
      desc: "Polyglot developer toolchain (GCC, CMake, Git, gh, Node.js 22, Rustup 1.99 with musl target, cargo-binstall, uv) plus the native Rust SuperForge source compiler (superforge + recipes.toml). Compiles and tunes workstation binaries with -march=native -mtune=native -flto=auto and target-cpu=native.",
      packages: ["superforge", "gcc", "gcc-c++", "make", "cmake", "gh", "nodejs22-bin", "rustup", "cargo-binstall", "uv"],
      configs: ["~/.config/superfedora/hardware-flags.env", "~/.config/superfedora/recipes.toml", "~/.rpmmacros"],
      verification: "superforge status && rustc --version && uv --version",
      tags: ["superforge", "-march=native", "recipes.toml", "Rust 1.99", "Node.js", "Python uv"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[FORGE: -march=native]", type: "hot" }, { text: "[RUST: target-cpu=native]", type: "cyan" }]
    },
    {
      id: "80",
      num: "80",
      slug: "80-ai",
      name: "SuperAgent, OpenClaw & Quake AI",
      desc: "Standalone Rust autonomous workstation agent (superagent): OpenClaw harness, local/LAN Ollama (sf-ollama), Antigravity CLI (agy), xAI Grok CLI, MiniMax Code (mcode), and Mistral Vibe — integrated into the Quake slide-down AI console on Super + ` with AGY // OPENCLAW Cast Comms.",
      packages: ["superagent", "openclaw", "sf-ollama", "agy (antigravity-cli)", "grok", "mcode", "vibe"],
      configs: ["~/.config/superfedora/ai-agent", "~/.config/superfedora/ollama-host", "~/.config/quickshell/panels/QuakeAi.qml"],
      verification: "superagent status && agy --version",
      tags: ["superagent", "OpenClaw", "sf-ollama", "Antigravity CLI", "Grok CLI", "MiniMax"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[QUAKE AI: SUPER+`]", type: "hot" }, { text: "[HARNESS: AGY // OPENCLAW]", type: "cyan" }]
    },
    {
      id: "90",
      num: "90",
      slug: "90-dotfiles",
      name: "Zero-Symlink Dotfiles & 9 Rust Binaries",
      desc: "Deploys direct files into ~/.config/ and 32 4K 16-bit wallpapers (01-crimson..16-fuchsia) into ~/Pictures/Wallpapers/ with automatic timestamped backups. Installs all 9 native Rust binaries (sf, supertheme, superforge, superdock, superbar, supersettings, supernotify, superlock, superagent) into ~/.local/bin/.",
      packages: ["sf", "superfedora", "supertheme", "superforge", "superdock", "superbar", "supersettings", "supernotify", "superlock", "superagent"],
      configs: ["~/.config/hypr/", "~/.config/quickshell/", "~/Pictures/Wallpapers/", "~/.local/bin/sf"],
      verification: "sf dotfiles --check && sf status",
      tags: ["Zero Symlinks", "16 Rainbow Palettes", "4K Wallpapers", "9 Rust Binaries"],
      stats: [{ text: "[STATUS: IDEMPOTENT]", type: "ready" }, { text: "[DOTFILES: 0-SYMLINK]", type: "hot" }, { text: "[THEMES: 16 RAINBOW X DARK/LIGHT]", type: "cyan" }]
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
