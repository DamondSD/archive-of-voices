export {}; // Foundry ES module

const marked = window.marked;

/**
 * Generate an NPC personality profile using GPT and return the HTML.
 * Journal is NOT saved automatically.
 * @param {object} data - NPC identity details.
 * @param {string} data.name - The name of the NPC.
 * @param {string} [data.gender] - Gender of the NPC (optional).
 * @param {string} [data.race] - Race or species (optional).
 * @param {string} [data.classRole] - Class or role (optional).
 * @param {string} [data.notes] - Optional archetype, personality notes, quirks.
 * @param {string} apiKey - OpenAI API key.
 * @param {string} model - GPT model to use.
 * @returns {Promise<string>} - The generated HTML string.
 */
export async function generateNpcProfile(data, apiKey, model = "gpt-4o") {
  const { name, gender, race, classRole, notes } = data;

  if (!name || !apiKey) {
    ui.notifications.warn("Missing NPC name or API key.");
    return;
  }

  // Build identity block conditionally
  let identity = `- Name: ${name}`;
  if (gender) identity += `\n- Gender: ${gender}`;
  if (race) identity += `\n- Race: ${race}`;
  if (classRole) identity += `\n- Class: ${classRole}`;
  if (notes) identity += `\n- Notes: ${notes}`;

  // Provide system ID context to GPT without enforcing rulesets
  const systemId = game.system.id;
  const systemContext = `The game system being used is "${systemId}". Do not refer to rules or stats from any specific system unless explicitly provided. Focus on narrative and personality.`;

  const systemPrompt = `${systemContext}

You are a character builder for a fantasy TTRPG.
Create a Markdown-formatted NPC profile that fits this identity if provided. If race, gender, or class are omitted, you may invent appropriate ones. If any are defined, honor them strictly.

**Identity:**
${identity}

Respond ONLY in Markdown using the following format.

Use \`##\` headings for each section. Do NOT include top-level headings, bold labels, or extra framing like "NPC Profile: X". Write clean paragraphs and bullet lists only. Format consistently.

Example output format:

## Role in the World  
(One paragraph)

## Goals and Motivations  
- Goal 1  
- Goal 2  
- Goal 3

## Fears or Weaknesses  
- Fear 1  
- Fear 2

## Personality Quirks or Habits  
- Quirk 1  
- Quirk 2  
- Quirk 3

## Suggested Voice or Speaking Style  
(Short paragraph)

## Example Phrases They Might Say  
- "Phrase 1"  
- "Phrase 2"  
- "Phrase 3"
`;

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
        { role: "user", content: `Generate personality profile for NPC named '${name}'` }
      ],
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("❌ GPT Error:", error);
    throw new Error(error.error?.message || "Unknown GPT error");
  }

  const dataOut = await response.json();
  const markdown = dataOut.choices?.[0]?.message?.content?.trim();
  const html = marked.parse(markdown || "(No content)");

  return html;
}
