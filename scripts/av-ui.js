export {}; // tells Foundry this is an ES module

// ✅ Import ApplicationV2 directly from Foundry core
import { ApplicationV2 } from "/scripts/foundry/foundry.js";
import { handleChatPrompt } from './av-chat.js';

console.log("📦 ArchiveOfVoicesUI module loaded");

export class ArchiveOfVoicesUI extends ApplicationV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "av-ui",
      title: "ArchiveOfVoices Assistant",
      template: "modules/archive-of-voices/templates/av-ui-v13.hbs",
      width: 700,
      height: 500,
      resizable: true
    });
  }

  async getData(options) {
    const npcJournals = game.journal.filter(j =>
      j.folder?.name === "NPC Memories"
    );

    return {
      isGM: game.user.isGM,
      npcList: npcJournals.map(j => j.name)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const buttons = html.find(".tab");
    const contents = html.find(".tab-content");

    buttons.on("click", (event) => {
      const tab = event.currentTarget.dataset.tab;
      buttons.removeClass("active");
      $(event.currentTarget).addClass("active");
      contents.addClass("hidden");
      html.find(`#tab-${tab}`).removeClass("hidden");
    });

    html.find("#av-send").on("click", async () => {
      const query = html.find("#prompt").val().trim();
      const npcName = html.find("#npc-select").val();

      if (!query) {
        ui.notifications.warn("Please enter a question.");
        return;
      }

      const output = html.find("#av-output");
      output.html(`<em>Thinking...</em>`);

      try {
        const reply = await handleChatPrompt(query, npcName);
        output.html(reply);
      } catch (err) {
        output.html(`<p class="av-response-error">❌ Failed to get response.</p>`);
      }
    });

    html.find("#npc-generate").on("click", async () => {
      const name = html.find("#npc-name").val().trim();
      const gender = html.find("#npc-gender").val();
      const race = html.find("#npc-race").val();
      const classRole = html.find("#npc-class").val();
      const notes = html.find("#npc-notes").val().trim();

      if (!name) {
        ui.notifications.warn("Please enter an NPC name.");
        return;
      }

      const traits = html.find("input[name='trait']:checked").map(function () {
        return this.value;
      }).get();

      const previewBox = html.find("#npc-preview");
      previewBox.html(`<em>Generating personality profile...</em>`);

      const apiKey = game.settings.get("archive-of-voices", "apiKey");
      const model = game.settings.get("archive-of-voices", "gptModel") || "gpt-4o";

      try {
        const { generateNpcProfile } = await import("./av-npc.js");

        const htmlContent = await generateNpcProfile(
          { name, gender, race, classRole, notes: `${notes}\nTraits: ${traits.join(", ")}` },
          apiKey,
          model
        );

        previewBox.html(htmlContent);
        html.find("#npc-save").removeClass("hidden");
        this._generatedNpc = { name, htmlContent };

      } catch (err) {
        console.error("❌ Error generating NPC:", err);
        previewBox.html(`<p class="av-response-error">❌ Failed to generate NPC: ${err.message}</p>`);
      }
    });

    html.find("#npc-save").on("click", async () => {
      const data = this._generatedNpc;
      if (!data || !data.name || !data.htmlContent) {
        ui.notifications.warn("No generated profile to save.");
        return;
      }

      let folder = game.folders.find(f => f.name === "NPC Memories" && f.type === "JournalEntry");
      if (!folder) {
        folder = await Folder.create({ name: "NPC Memories", type: "JournalEntry", color: "#999" });
      }

      const existing = game.journal.find(j => j.name === data.name && j.folder?.id === folder.id);
      if (existing) {
        const page = existing.pages.find(p => p.name === "Profile");
        if (page) {
          await page.update({ "text.content": data.htmlContent });
        } else {
          await existing.createEmbeddedDocuments("JournalEntryPage", [{
            name: "Profile",
            type: "text",
            text: { content: data.htmlContent, format: 1 }
          }]);
        }
      } else {
        await JournalEntry.create({
          name: data.name,
          folder: folder.id,
          pages: [{
            name: "Profile",
            type: "text",
            text: { content: data.htmlContent, format: 1 }
          }]
        });
      }

      ui.notifications.info(`📘 ${data.name}'s profile has been saved to NPC Memories.`);
      html.find("#npc-save").addClass("hidden");
    });
  }
}
