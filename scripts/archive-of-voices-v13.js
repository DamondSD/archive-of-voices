// av.js — complete assistant backend

Hooks.once("init", () => {
  console.log("✅ [archive-of-voices] Initializing ArchiveOfVoices Assistant Module");

  // Hide the API key like a password
  Hooks.on("renderSettingsConfig", (app, html, data) => {
  const input = html.find('input[name="archive-of-voices.openaiApiKey"]');
  if (input.length) {
    input.attr("type", "password");
  }
});


  // Register the OpenAI API Key setting (world scope, shared across all users)
game.settings.register("archive-of-voices", "openaiApiKey", {
  name: "OpenAI API Key",
  hint: "This key is shared across the world. Only the GM should set or see this value.",
  scope: "world",          // ✅ Shared across all users
  config: true,
  type: String,
  default: "",
  onChange: value => console.log("🔐 API key updated.")
});

// 🔄 Migrate any old client-scoped key (if upgrading from earlier versions)
Hooks.once("ready", async () => {
  const worldKey = game.settings.get("archive-of-voices", "openaiApiKey");

  // Only GMs can trigger the migration
  if (!worldKey && game.user.isGM) {
    try {
      // Try to read old client-scoped setting
      const oldClientKey = game.settings.get("archive-of-voices", "openaiApiKey", { scope: "client" });
      if (oldClientKey) {
        await game.settings.set("archive-of-voices", "openaiApiKey", oldClientKey);
        console.log("🔄 Migrated client-scoped API key to world-scoped setting.");
      }
    } catch (err) {
      // Some environments may throw if no client setting exists
      console.warn("No client-scoped API key found for migration.");
    }
  }
});

  // GPT Model selection
  game.settings.register("archive-of-voices", "gptModel", {
    name: "OpenAI Model",
    hint: "Choose the OpenAI model to use for responses.",
    scope: "client",
    config: true,
    type: String,
    choices: {
      "gpt-4o": "GPT-4o (Fastest + Multimodal)",
      "gpt-4": "GPT-4 (Accurate, slower)",
      "gpt-3.5-turbo": "GPT-3.5 Turbo (Fast & cheap)"
    },
    default: "gpt-4o"
  });

  // Toggle for whisper-to-GM
  game.settings.register("archive-of-voices", "whisperToGM", {
    name: "Whisper Archive Of Voices Replies to GM",
    hint: "If enabled, Archive Of Voices replies will be whispered only to the GM.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Toggle to show/hide robot GUI button for non-GMs
  game.settings.register("archive-of-voices", "gmOnlyButton", {
    name: "GM-Only Robot Button",
    hint: "Only show the ArchiveOfVoices GUI button for GMs.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.once("ready", async () => {
  console.log("🤖 [archive-of-voices] ArchiveOfVoices module ready");

if (!game.user.isGM) return;
console.log("🟢 ArchiveOfVoices GM socket listener active.");


  // 🧠 Auto-create "Helper" memory journal if missing
  const existing = [...game.journal.values()].find(j =>
  j.name === "Helper" && j.folder?.name === "NPC Memories"
);

if (!existing) {
  let folder = game.folders.find(f =>
    f.name === "NPC Memories" && f.type === "JournalEntry"
  );

  if (!folder) {
    folder = await Folder.create({
      name: "NPC Memories",
      type: "JournalEntry",
      color: "#9e9e9e"
    });
  }

  await JournalEntry.create({
    name: "Helper",
    folder: folder.id,
    pages: [{
      name: "Helper Memory Guide",
      type: "text",
      text: {
        content: `
<h2>🤖 Helper — Your Memory Guide</h2>
<p><strong>Who I Am:</strong> I’m your friendly tutorial construct. Ask me how to use NPC memory!</p>

<h3>🛠️ Example Prompts</h3>
<ul>
  <li><code>Helper, how do I create a new memory NPC?</code></li>
  <li><code>Helper, what do I put in a memory journal?</code></li>
  <li><code>Helper, show me how Jaaris works.</code></li>
</ul>

<h3>📘 Rules of Memory Journals</h3>
<ul>
  <li>Name the journal <strong>exactly</strong> the same as the NPC</li>
  <li>Put it in the folder <code>NPC Memories</code></li>
  <li>Include background, known facts, personality traits, etc.</li>
</ul>

<p><em>Try it now by asking me something!</em></p>
        `,
        format: 1
      }
    }]
  });

  ui.notifications.info("📘 'Helper' NPC created in NPC Memories folder.");
}


  // 💬 Slash command listener
  Hooks.on("chatMessage", (chatLog, message, chatData) => {
    if (!message.startsWith("/gpt")) return true;
    const prompt = message.slice(4).trim();
    if (!prompt) return false;

    const model = game.settings.get("archive-of-voices", "gptModel") || "gpt-4o";
    const whisper = game.settings.get("archive-of-voices", "whisperToGM");

    handleGPTCommand(prompt, null, model).then(reply => {
      ChatMessage.create({
        content: `<strong>ArchiveOfVoices:</strong> ${reply || "(No response)"}`,
        whisper: whisper ? ChatMessage.getWhisperRecipients("GM") : undefined
      });
    });

    return false;
  });
});

// Core handler shared by GUI and /gpt
async function handleGPTCommand(prompt, npcName = null, model = "gpt-4o") {
  const apiKey = game.settings.get("archive-of-voices", "openaiApiKey");
  if (!apiKey) {
    ui.notifications.warn("No OpenAI API key set in settings.");
    return "(No API key set)";
  }

  // 🧠 Load NPC memory from folder
  let memory = "";
if (npcName) {
  const journal = [...game.journal.values()].find(j =>
    j.name === npcName && j.folder?.name === "NPC Memories"
  );

  if (journal) {
    memory = [...journal.pages.values()].map(p => p.text?.content || "").join("\n");
  } else {
    console.warn(`⚠️ No memory entry found for ${npcName}`);
  }
}


  const systemPrompt = npcName
    ? `You are roleplaying as ${npcName}, an NPC in a fantasy world. Your known memory is as follows:\n${memory}\nRespond in character. Do not invent facts or knowledge not found in memory. If you do not know the answer based on the memory, say so in character.`
    : "You are a helpful and in-character fantasy assistant.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

      // ✏️ Append Q&A to NPC journal memory
  if (npcName) {
  const journal = [...game.journal.values()].find(j =>
    j.name === npcName && j.folder?.name === "NPC Memories"
  );

  if (journal) {
    let logPage = journal.pages.getName("Memory Log");

    // If no log page, create one
    if (!logPage) {
      logPage = await journal.createPages([{
        name: "Memory Log",
        type: "text",
        text: { content: "", format: 1 }
      }]).then(pages => pages[0]);
    }

    const previous = logPage.text.content || "";
    const timestamp = new Date().toLocaleString();
    const entry = `<p><strong>${timestamp}</strong><br><strong>Q:</strong> ${prompt}<br><strong>A:</strong> ${reply}</p>\n<hr>\n`;

    if (game.user.isGM) {
      await logPage.update({ "text.content": previous + entry });
    } else {
      console.log("📤 Sending socket request to GM for memory log update.");
      archiveSocket?.executeAsGM("updateJournalPage", journal.id, "Memory Log", previous + entry);
    }
  }
}


    return reply || "(No response)";
  } catch (err) {
    console.error("[archive-of-voices] API Error:", err);
    ui.notifications.error("ArchiveOfVoices API error — check console for details.");
    return "(Error retrieving response)";
  }
}
/* for testing only
Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
  if (messageText === "/av-test") {
    const testJournal = game.journal.find(j => j.name === "Helper" && j.folder?.name === "NPC Memories");
    if (!testJournal) {
      ui.notifications.warn("No test journal found.");
      return false;
    }

    const testContent = `<p><strong>${new Date().toLocaleString()}</strong><br><strong>Q:</strong> Test Prompt<br><strong>A:</strong> Test Answer</p><hr>`;

    game.modules.get("socketlib")?.api?.emitAsGM(
      "archive-of-voices",
      "updateJournalPage",
      testJournal.id,
      "Memory Log",
      testContent
    );

    console.log("📤 /av-test socketlib emit fired.");
    return false;
  }
});*/

// 🔄 Expose for GUI access
document.addEventListener("DOMContentLoaded", () => {
  window.handleGPTQuery = handleGPTCommand;
});

Hooks.once("init", () => {
  console.log("📦 SocketLib module object:", game.modules.get("socketlib"));
});

// GM control for NPC memories update
Hooks.once("socketlib.ready", () => {
  if (!window.socketlib?.registerModule) {
    console.error("❌ window.socketlib.registerModule is not available.");
    ui.notifications.error("SocketLib is loaded, but not exposing its API.");
    return;
  }

  const socket = window.socketlib.registerModule("archive-of-voices");
  if (!socket) {
    console.error("❌ Failed to register ArchiveOfVoices with SocketLib.");
    return;
  }

  console.log("🟢 ArchiveOfVoices socketlib functions registered.");

  socket.register("updateJournalPage", async (journalId, pageName, newContent) => {
    const journal = game.journal.get(journalId);
    if (!journal) return;

    const page = journal.pages.find(p => p.name === pageName);
    if (!page) return;

    await page.update({ "text.content": newContent });
    console.log(`[ArchiveOfVoices] ✅ GM updated '${pageName}' in Journal: ${journal.name}`);
  });

  socket.register("testEcho", (callerName) => {
    if (game.user.isGM) {
      console.log(`📥 Received test socket from ${callerName}`);
      ui.notifications.info(`📥 Test received from ${callerName}`);
    }
  });
});

// Testing only
let archiveSocket;

Hooks.once("socketlib.ready", () => {
  if (!window.socketlib?.registerModule) return;
  archiveSocket = window.socketlib.registerModule("archive-of-voices");

  archiveSocket.register("testEcho", (callerName) => {
    if (game.user.isGM) {
      console.log(`📥 Received test socket from ${callerName}`);
      ui.notifications.info(`📥 Test received from ${callerName}`);
    }
  });
});

Hooks.on("chatMessage", (log, msg, data) => {
  if (msg === "/av-lite") {
    if (!archiveSocket) {
      console.warn("⚠️ ArchiveOfVoices socket not initialized yet.");
      return false;
    }
    archiveSocket.executeAsGM("testEcho", game.user.name);
    return false;
  }
});

// end testing only
