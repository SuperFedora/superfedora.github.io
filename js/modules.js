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
      verification: "antigravity --version && grok --version",
      tags: ["Antigravity", "Grok CLI", "MiniMax", "Mistral Vibe"]
    },
    {
      id: "90",
      num: "90",
      slug: "90-dotfiles",
      name: "Zero-Symlink Dotfiles & CLI",
      desc: "Deploys production configurations into ~/.config/ as direct files. Preserves existing configs with timestamped backups. Installs sf and superfedora dual symlinks to ~/.local/bin/ and executes full workstation validation.",
      packages: ["sf", "superfedora"],
      configs: ["~/.config/hypr/", "~/.config/quickshell/", "~/.config/fuzzel/", "~/.local/bin/sf"],
      verification: "sf doctor && sf verify",
      tags: ["Zero Symlinks", "sf CLI", "Backups", "Dotfiles"]
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

    selectModule("00");
  }

  window.ModulesHUD = {
    data: modulesData,
    select: selectModule,
    init: initModules
  };

  document.addEventListener("DOMContentLoaded", initModules);
})();
