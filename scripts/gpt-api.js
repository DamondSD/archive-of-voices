export {}; // ES module declaration

import { handleMemoryGPT } from "./memory-gpt.js";

/**
 * Unified entry point for all GPT queries.
 * - Uses memory-aware GPT if npcName is provided
 * - Falls back to a general GPT assistant if npcName is null or ""
 */
export async function handleGPTQuery(prompt, npcName, model = "gpt-4o", apiKey) {
  console.log("🌐 handleGPTQuery →", npcName || "(no NPC)");

  // Memory-aware path
  if (npcName) {
    return await handleMemoryGPT(prompt, npcName, model, apiKey);
  }

  // Generic assistant fallback
  const systemPrompt = "You are ArchiveOfVoices, a helpful assistant for fantasy tabletop roleplaying games. Stay in character as a wise and immersive guide.";

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

  if (!response.ok) {
    console.error("GPT API error:", data);
    throw new Error(data.error?.message || "Unknown GPT API error");
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply || "⚠️ GPT returned an empty response.";
}
