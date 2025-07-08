export {}; // tells Foundry this is an ES module

import { handleGPTQuery } from './gpt-api.js';


export async function handleChatPrompt(query, npcName = null) {
  const apiKey = game.settings.get("archive-of-voices", "apiKey");
  const model = game.settings.get("archive-of-voices", "gptModel") || "gpt-4o";
  const whisperToGM = game.settings.get("archive-of-voices", "whisperToGM");

  if (!apiKey || !query) {
    ui.notifications.warn("Missing API key or prompt.");
    return `<p class="av-response-error">⚠️ GPT prompt or key missing.</p>`;
  }

  // Post the question to chat
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `<strong>You asked ArchiveOfVoices:</strong><br>${query}`,
    whisper: whisperToGM ? ChatMessage.getWhisperRecipients("GM") : undefined
  });

  // Ask GPT (uses your global function or we can replace this later)
  let reply = "";
  try {
    reply = await handleGPTQuery(query, npcName, model, apiKey); // 🔥 Call the new module function
  } catch (err) {
    console.error("❌ GPT error:", err);
    return `<p class="av-response-error">❌ GPT request failed: ${err.message}</p>`;
  }

  // Post the reply to chat
  await ChatMessage.create({
    speaker: { alias: "ArchiveOfVoices" },
    content: reply,
    whisper: whisperToGM ? ChatMessage.getWhisperRecipients("GM") : undefined
  });

  return reply;
}
