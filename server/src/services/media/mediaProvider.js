const { exec } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const execAsync = util.promisify(exec);

/**
 * MediaProvider abstraction for visual asset acquisition.
 * Supports local fallback generation when no external provider is available.
 */
class MediaProvider {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Search for images matching a query.
   * Returns array of asset descriptors or empty array if unavailable.
   */
  async searchImages(query, count = 3) {
    return [];
  }

  /**
   * Search for videos matching a query.
   */
  async searchVideos(query, count = 3) {
    return [];
  }

  /**
   * Generate an image from a prompt.
   */
  async generateImage(prompt, options = {}) {
    return null;
  }

  /**
   * Generate a video from a prompt.
   */
  async generateVideo(prompt, options = {}) {
    return null;
  }
}

/**
 * LocalFallbackMediaProvider - generates synthetic visual assets using FFmpeg.
 * Used when no external media provider is available.
 * Assets are clearly synthetic but produce real, playable video frames.
 */
class LocalFallbackMediaProvider extends MediaProvider {
  constructor(options = {}) {
    super(options);
    this.outputDir = options.outputDir || path.join(__dirname, "../../../renders");
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a synthetic video frame/clip from a scene descriptor.
   * Produces a real MP4 with color background, gradient, and text overlay.
   */
  async generateScene(scene, options = {}) {
    const {
      width = 1080,
      height = 1920,
      duration = 3,
      fps = 30,
      outputDir = this.outputDir,
    } = options;

    const filename = `scene_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.mp4`;
    const outputPath = path.join(outputDir, filename);

    const safeText = (scene.text || scene.title || "SCENE")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:");

    const color = scene.color || "#1a1a2e";
    const accentColor = scene.accentColor || "#9b6cff";

    // Write filter script to avoid shell quoting issues
    const filterScriptPath = path.join(outputDir, `filter_${filename}.txt`);
    const filterContent = `drawtext=fontfile=/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf:text='${safeText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5:boxborderw=20`;
    fs.writeFileSync(filterScriptPath, filterContent, "utf-8");

    const cmd = `ffmpeg -y -f lavfi -i color=c=${color}:s=${width}x${height}:r=${fps}:d=${duration} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -filter_complex_script "${filterScriptPath}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest "${outputPath}"`;

    try {
      await execAsync(cmd, { timeout: 30000 });
      return {
        type: "GENERATED_VIDEO",
        source: "local_fallback",
        path: outputPath,
        url: `/renders/${filename}`,
        query: scene.query || scene.text,
        duration,
        width,
        height,
      };
    } catch (err) {
      throw new Error(`Local scene generation failed: ${err.message}`);
    }
  }

  /**
   * Generate a title card scene.
   */
  async generateTitleCard(text, options = {}) {
    return this.generateScene({
      text,
      color: options.color || "#0a0a0f",
      accentColor: options.accentColor || "#9b6cff",
    }, options);
  }
}

module.exports = {
  MediaProvider,
  LocalFallbackMediaProvider,
};