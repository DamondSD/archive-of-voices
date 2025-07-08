export {}; // tells Foundry this is an ES module

export function registerAvSettings() {
    // API KEY
game.settings.register("archive-of-voices", "apiKey", {
  name: "OpenAI API Key",
  hint: "Used for GPT access. Hidden from players.",
  scope: "world",
  config: true,
  type: String,
  default: "",
  onChange: value => {
  console.log("🔑 API key updated:", value.length > 0 ? "[HIDDEN]" : "[empty]");
  }
});


    // GPT model
    game.settings.register("archive-of-voices", "gptModel", {
        name: "GPT Model",
        scope: "world",
        config: true,
        type: String,
        choices: {
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gpt-4": "GPT-4",
        "gpt-4o": "GPT-4o"
        },
        default: "gpt-4o"
    });

    // Whisper setting
    game.settings.register("archive-of-voices", "whisperToGM", {
        name: "Whisper replies to GM only",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    // GM only Button
    game.settings.register("archive-of-voices", "gmOnlyButton", {
        name: "Only Show AV Button to GM",
        hint: "If enabled, the ArchiveOfVoices button will only appear for GMs.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

}
