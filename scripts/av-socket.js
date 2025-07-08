export {}; // tells Foundry this is an ES module

export function registerAvSockets() {
  if (!window.socketlib?.registerModule) {
    console.error("❌ SocketLib not available.");
    return;
  }

  const archiveSocket = socketlib.registerModule("archive-of-voices");

  archiveSocket.register("updateMemoryLog", async ({ journalId, pageName, content }) => {
    const journal = game.journal.get(journalId);
    if (!journal) return;

    const page = journal.pages.find(p => p.name === pageName);
    if (!page) return;

    await page.update({ "text.content": content });
    console.log(`[ArchiveOfVoices] ✅ GM updated memory log for '${journal.name}'`);
  });

  console.log("📡 ArchiveOfVoices sockets registered");
}
