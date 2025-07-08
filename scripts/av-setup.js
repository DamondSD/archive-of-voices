import { ArchiveOfVoicesUI } from "./av-ui.js";
import { registerAvSettings } from './av-settings.js';
import { ensureHelperJournal } from './av-helper.js';
import { registerAvSockets } from "./av-socket.js";

console.log("🧪 av-setup.js is definitely loading");

// Register settings during Foundry's init phase
Hooks.once("init", () => {
  console.log("⚙️ ArchiveOfVoices: registering settings");
  registerAvSettings();
});

// Set up the application and inject the button after everything is ready
Hooks.once("ready", async () => {
  console.log("🚀 ArchiveOfVoices setup running");

  game.avUI = new ArchiveOfVoicesUI();
  console.log("✅ game.avUI assigned");

  await ensureHelperJournal(); // 👈 Adds the Helper bot back in

  Hooks.on("renderJournalDirectory", (app, html) => {
    const header = html.querySelector(".header-actions");
    if (!header || header.querySelector(".av-launch-btn")) return;

    const btn = document.createElement("button");
    btn.classList.add("av-launch-btn");
    btn.title = "Open ArchiveOfVoices";
    btn.innerHTML = `<i class="fas fa-robot"></i> AV UI`;

    btn.addEventListener("click", () => {
      game.avUI.render(true);
    });

    header.appendChild(btn);
  });

  // Force journal to re-render so our button appears
  ui.journal?.render(true);
});

// Hide API key in settings UI
Hooks.on("renderSettingsConfig", (app, html, data) => {
  const input = html[0].querySelector(`input[name="archive-of-voices.apiKey"]`);
  if (input) {
    console.log("🔐 Masking API key field");
    input.setAttribute("type", "password");
  }
});

Hooks.once("socketlib.ready", registerAvSockets);
