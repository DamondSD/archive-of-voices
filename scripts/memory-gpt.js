export {}; // tells Foundry this is an ES module

export async function handleMemoryGPT(prompt, npcName, model = "gpt-4o", apiKey) {
  const endpoint = "https://api.openai.com/v1/chat/completions";
  let memory = "";

  // 1. Load NPC memory journal
  const journal = game.journal.find(j =>
    j.name === npcName && j.folder?.name === "NPC Memories"
  );

console.log("🧠 Selected NPC:", npcName);
console.log("📘 Matched Journal:", journal);


  if (journal) {
    memory = journal.pages
      .map(p => p.text?.content || "")
      .join("\n");
      console.log("📝 Injected memory into system prompt:", memory);
  } else {
    console.warn(`⚠️ No memory entry found for ${npcName}`);
  }

  // 2. Construct system prompt
  const systemPrompt = npcName
    ? `You are roleplaying as ${npcName}, an NPC in a fantasy world. Known memory:\n${memory}\nStay in character.`
    : "You are a helpful fantasy world assistant.";

  // 3. Fetch response
  const response = await fetch(endpoint, {
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
  const reply = data.choices?.[0]?.message?.content?.trim() || "(No response)";

  // 4. Append to Memory Log
  if (journal) {
    let logPage = journal.pages.find(p => p.name === "Memory Log");

    if (!logPage) {
      logPage = await journal.createEmbeddedDocuments("JournalEntryPage", [{
        name: "Memory Log",
        type: "text",
        text: { content: "", format: 1 }
      }]).then(pages => pages[0]);
    }

    const previous = logPage.text.content || "";
    const timestamp = new Date().toLocaleString();
    const entry = `<p><strong>${timestamp}</strong><br><strong>Q:</strong> ${prompt}<br><strong>A:</strong> ${reply}</p><hr>`;

    if (game.user.isGM) {
      await logPage.update({ "text.content": previous + entry });
    } else {
      // If not GM, emit socket update (assuming socketlib is configured)
      game.socket?.emit("module.archive-of-voices", {
        action: "updateMemoryLog",
        journalId: journal.id,
        pageName: "Memory Log",
        content: previous + entry
      });
    }
  }

  return reply;
}
