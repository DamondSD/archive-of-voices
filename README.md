# 🗣️ Archive of Voices

A Foundry VTT module for managing dynamic, memory-aware NPC conversations using OpenAI — now fully integrated with SocketLib for multiplayer-safe journal updates.

---

## ✨ Features

- 🤖 Ask questions of NPCs and get in-character answers.
- 📘 Automatically creates and maintains "Memory Logs" for each NPC.
- 🧠 NPC memory is stored in Journal Entries inside the **NPC Memories** folder.
- 📤 Players' questions and NPC responses are logged via SocketLib — even if the player isn't the GM.
- 🧪 Slash command `/av-lite` to test GM socket response.
- 🧰 GUI interface for chatting, generating NPCs, and saving logs.

---

## 🧩 Requirements

- [SocketLib](https://foundryvtt.com/packages/socketlib) (must be installed and enabled)
- Foundry VTT 10+

---

## 📂 Installation

### 📥 Install via Manifest

Foundry v11–v12:
```
https://raw.githubusercontent.com/DamondSD/archive-of-voices/main/module.json
```

Foundry v13:
```
https://raw.githubusercontent.com/DamondSD/archive-of-voices/v13-support/module.json
```

💡 _Using the wrong version may result in journal updates or template errors. Always match your Foundry version._

Or install manually:

1. Download the latest release `.zip` from the [Releases](https://github.com/DamondSD/archive-of-voices/releases)
2. Extract into your `FoundryVTT/Data/modules` folder
3. Enable in your World > Manage Modules

---

## 🚀 Usage

### 🔹 Getting Started

1. Enable the module and SocketLib in your world.
2. Configure your **OpenAI API key** in Game Settings.
3. Press the 🤖 robot button in chat controls to open the GUI.
4. Select an NPC and ask a question, or generate a new NPC.

### 🔹 Memory Logs

- Create a journal named exactly like your NPC (e.g. `Jaaris`) inside a folder called `NPC Memories`
- All conversations are logged under a page titled `Memory Log`

---

## 🔧 Developer Notes

- Uses `window.socketlib.registerModule(...)` for official compatibility
- Socket functions registered under `archive-of-voices`
- `executeAsGM(...)` used for player-to-GM journal updates

---

## 🧪 Debugging

- Use `/av-lite` in chat to verify GM socket registration.
- Watch the browser console for logs like:
  ```
  📥 Received test socket from PlayerName
  ✅ GM updated 'Memory Log' in Journal: Jaaris
  ```

---

## 📬 Contact & Support

- 📧 Email: shadowdrake24@gmail.com
- 💬 Discord: [Join the community](https://discord.gg/JbTneapH)
- 🛠 GitHub: [Open an issue](https://github.com/DamondSD/archive-of-voices/issues)

_This is the free version of Archive of Voices. The Pro version adds voice capture, memory editors, and more._

---

## 📜 License

MIT

---

## 🙏 Credits

Created by Damond Shadowdrake and Shadowdrake Creations  
Inspired collaborative worldbuilding tools.
