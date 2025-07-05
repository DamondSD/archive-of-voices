class ArchiveOfVoicesUI extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "av-ui",
      title: "ArchiveOfVoices Assistant",
      template: "modules/archive-of-voices/templates/av-ui.html",
      width: 700,
      height: 500,
      resizable: true
    });
  }

  async getData(options = {}) {
    return {
      isGM: game.user.isGM
    };
  }
}

Hooks.on("renderArchiveOfVoicesUI", async (app, html) => {
  // ✅ Load marked.min.js if not already loaded
  if (typeof marked === "undefined") {
    await loadScript("modules/archive-of-voices/lib/marked.min.js");
    console.log("📘 marked.js loaded");
  }

  const tabButtons = html[0].querySelectorAll(".tab");
  const tabContents = html[0].querySelectorAll(".tab-content");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.add("hidden"));
      btn.classList.add("active");
      html[0].querySelector(`#tab-${tabId}`).classList.remove("hidden");
    });
  });

  const sendButton = html[0].querySelector("#av-send");
  const textarea = html[0].querySelector("#prompt");
  const npcSelect = html[0].querySelector("#npc-select");
  const output = html[0].querySelector("#av-output");
  const saveBtn = html[0].querySelector("#save-npc-journal");

  if (npcSelect) {
    npcSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.text = "None";
    npcSelect.appendChild(noneOption);
    const memoryFolder = game.folders.find(f => f.name === "NPC Memories" && f.type === "JournalEntry");
    if (memoryFolder) {
      memoryFolder.contents.forEach(journal => {
        const option = document.createElement("option");
        option.value = journal.name;
        option.text = journal.name;
        npcSelect.appendChild(option);
      });
    }
  }

  if (sendButton) {
    sendButton.addEventListener("click", async () => {
      const query = textarea.value.trim();
      const npcName = npcSelect.value || null;
      const model = game.settings.get("archive-of-voices", "gptModel") || "gpt-4o";
      const whisperToGM = game.settings.get("archive-of-voices", "whisperToGM");

      if (!query) return;

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: `<strong>You asked ArchiveOfVoices:</strong> ${query}`,
        whisper: whisperToGM ? ChatMessage.getWhisperRecipients("GM") : undefined
      });

      const reply = await window.handleGPTQuery(query, npcName, model);

      await ChatMessage.create({
        speaker: { alias: "ArchiveOfVoices" },
        content: reply,
        whisper: whisperToGM ? ChatMessage.getWhisperRecipients("GM") : undefined
      });

      if (output) output.innerHTML = reply;
      textarea.value = "";
    });
  }

  const generateBtn = html[0].querySelector("#generate-npc");

  const npcForm = html[0].querySelector("#npc-form") || html[0]; // Replace #npc-form with your actual container ID

  npcForm.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents page reload
      generateBtn?.click();   // Simulates clicking the button
    }
  });

  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      const name = html[0].querySelector("#npc-name")?.value.trim() || "Unnamed NPC";
      const race = html[0].querySelector("#npc-race")?.value;
      const npcClass = html[0].querySelector("#npc-class")?.value;
      const gender = html[0].querySelector("#npc-gender")?.value;
      const notes = html[0].querySelector("#npc-notes")?.value.trim();
      const traitBoxes = html[0].querySelectorAll("input[type='checkbox']:checked");
      const traits = Array.from(traitBoxes).map(cb => cb.value);

      const outputBox = html[0].querySelector("#npc-output");
      if (outputBox) outputBox.innerHTML = `<em>Generating personality...</em>`;
      if (saveBtn) saveBtn.classList.add("hidden");

      const systemId = game.system.id;
      let systemContext = "";

      switch (systemId) {
        case "dnd5e":
          systemContext = "You are generating a character using Dungeons & Dragons 5th Edition rules.";
          break;
        case "pf2e":
          systemContext = "You are generating a character using Pathfinder 2nd Edition rules.";
          break;
        case "coc7":
          systemContext = "You are generating a character using Call of Cthulhu 7th Edition rules.";
          break;
        default:
          systemContext = `Use only themes and logic from the ${systemId} system.`;
      }

      let prompt = `${systemContext}

Create a detailed personality profile for an NPC named ${name}.`;
      if (race) prompt += ` The character is a ${race}`;
      if (gender) prompt += `, ${gender}`;
      if (npcClass) prompt += `, and a ${npcClass}.`;
      prompt += `

`;

      if (traits.length) {
        prompt += `Personality traits to consider: ${traits.join(", ")}.
`;
      }

      if (notes) {
        prompt += `Additional details: ${notes}
`;
      }

      prompt += `
Include quirks, demeanor, and immersive roleplaying notes. Avoid stat blocks.

Respond only in GitHub-flavored Markdown.
Use:
- \`###\` for section headers (e.g. Background, Traits)
- \`-\` for bullet points
- \`**Label**: value\` for traits or notes
Avoid using HTML tags or formatting.`;

      try {
        const reply = await window.handleGPTQuery(prompt, name, "gpt-4o");

        console.log("📝 Raw GPT reply:", reply);
        const parsed = marked.parse(reply);
        console.log("📄 Parsed HTML:", parsed);

        if (outputBox) outputBox.innerHTML = parsed;

        if (saveBtn) {
          saveBtn.dataset.rawReply = reply;
          saveBtn.classList.remove("hidden");
        }
      } catch (err) {
        if (outputBox) outputBox.innerHTML = `<span style="color: red;">${err.message}</span>`;
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const name = html[0].querySelector("#npc-name")?.value.trim() || "Unnamed NPC";
      const markdown = saveBtn.dataset.rawReply || "";
      if (!markdown.trim()) {
        ui.notifications.warn("❗ No personality data to save. Please generate an NPC first.");
        return;
      }

      const htmlContent = marked.parse(markdown);
      console.log("📘 Saving HTML content:", htmlContent);

      let folder = game.folders.find(f => f.name === "NPC Memories" && f.type === "JournalEntry");
      if (!folder) {
        folder = await Folder.create({ name: "NPC Memories", type: "JournalEntry", color: "#a200ff" });
      }

      const journal = await JournalEntry.create({
        name,
        folder: folder.id
      });

      await journal.createEmbeddedDocuments("JournalEntryPage", [
        {
          name: "Personality",
          type: "text",
          text: {
            content: `<h2>${name}'s Personality</h2>${htmlContent}`,
            format: 1
          }
        }
      ]);

      ui.notifications.info(`✅ Saved personality to journal: ${name}`);
    });
  }
});

Hooks.once("ready", () => {
  game.avUI = new ArchiveOfVoicesUI();

  const waitForChatControls = () => {
    const chatControls = document.querySelector("#chat-controls");
    if (!chatControls) return setTimeout(waitForChatControls, 100);

    if (chatControls.querySelector(".av-button")) return;

    const gmOnly = game.settings.get("archive-of-voices", "gmOnlyButton");
    if (gmOnly && !game.user.isGM) return;

    const icon = document.createElement("a");
    icon.classList.add("chat-control-icon", "av-button");
    icon.innerHTML = `<i class="fas fa-robot"></i>`;
    icon.title = "ArchiveOfVoices Assistant";

    icon.addEventListener("click", () => {
      game.avUI.render(true);
    });

    chatControls.appendChild(icon);
  };

  waitForChatControls();
});
