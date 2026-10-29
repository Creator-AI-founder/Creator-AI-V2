const { exec } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const execAsync = util.promisify(exec);

/**
 * VoiceProvider abstraction for text-to-speech synthesis.
 * Supports local espeak-ng and preserves architecture for future providers.
 */
class VoiceProvider {
  constructor(options = {}) {
    this.options = options;
  }

  async synthesize(text, options = {}) {
    throw new Error("synthesize() not implemented");
  }

  async listVoices() {
    return [];
  }

  supportsLanguage(lang) {
    return false;
  }
}

/**
 * EspeakVoiceProvider - local TTS using espeak-ng.
 * Supports English and Hindi via voice variants.
 */
class EspeakVoiceProvider extends VoiceProvider {
  constructor(options = {}) {
    super(options);
    this.outputDir = options.outputDir || path.join(__dirname, "../../../renders");
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Map language to espeak voice variant.
   */
  getVoiceForLanguage(lang) {
    const voices = {
      en: "en",
      "en-us": "en-us",
      "en-gb": "en-gb",
      hi: "hi",
      bn: "bn",
    };
    return voices[lang] || "en";
  }

  async synthesize(text, options = {}) {
    const lang = options.lang || "en";
    const voice = options.voice || this.getVoiceForLanguage(lang);
    const speed = options.speed || 160;
    const filename = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.wav`;
    const outputPath = path.join(this.outputDir, filename);

    // espeak-ng outputs to stdout, pipe to file
    const cmd = `espeak-ng -v ${voice} -s ${speed} -p 50 "${text.replace(/"/g, '\\"')}" -w "${outputPath}"`;

    try {
      await execAsync(cmd, { timeout: 15000 });

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        throw new Error("espeak-ng produced empty output");
      }

      return {
        path: outputPath,
        url: `/renders/${filename}`,
        duration: await this.getDuration(outputPath),
        language: lang,
        voice: voice,
        provider: "espeak-ng",
      };
    } catch (err) {
      throw new Error(`Voice synthesis failed: ${err.message}`);
    }
  }

  async getDuration(filePath) {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format "${filePath}"`
      );
      const data = JSON.parse(stdout);
      return parseFloat(data.format?.duration || 0);
    } catch {
      return 0;
    }
  }

  async listVoices() {
    return ["en", "en-us", "en-gb", "hi", "bn"];
  }

  supportsLanguage(lang) {
    return ["en", "en-us", "en-gb", "hi", "bn"].includes(lang);
  }
}

module.exports = {
  VoiceProvider,
  EspeakVoiceProvider,
};