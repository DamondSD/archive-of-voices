export {}; // tells Foundry this is an ES module

export async function ensureHelperJournal() {
  if (!game.user.isGM) return;

  const existing = [...game.journal.values()].find(j =>
    j.name === "Helper" && j.folder?.name === "NPC Memories"
  );

  if (existing) return;

  // Ensure folder exists
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
  <li><code>Helper, where are memories located.</code></li>
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
