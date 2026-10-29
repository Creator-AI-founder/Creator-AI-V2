const path = require("path");
const fs = require("fs");

/**
 * CaptionEngine generates ASS / SRT / drawtext filters for captions.
 */
class CaptionEngine {
  constructor(options = {}) {
    this.fontFile = options.fontFile || "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf";
  }

  /**
   * Generate an FFmpeg drawtext filter string for a caption.
   * Text is safely escaped for use in filter_complex_script files.
   */
  generateDrawTextFilter(text, startTime, endTime, options = {}) {
    const fontSize = options.fontSize || 56;
    const fontColor = options.fontColor || "white";
    const boxColor = options.boxColor || "black@0.6";
    const safeText = (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:");

    // Enable display only during [startTime, endTime]
    const enableExpr = `between(t,${startTime},${endTime})`;

    return `drawtext=fontfile=${this.fontFile}:text='${safeText}':fontcolor=${fontColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=h-(h/4):box=1:boxcolor=${boxColor}:boxborderw=18:enable='${enableExpr}'`;
  }

  /**
   * Write caption filter chain to a filter_complex_script file.
   * Returns the file path.
   */
  writeFilterScript(actions, scriptPath, options = {}) {
    const filter = this.generateFilterChain(actions);
    if (!filter) return null;
    fs.writeFileSync(scriptPath, filter, "utf-8");
    return scriptPath;
  }

  /**
   * Generate multi-line caption filter chain from blueprint actions or script.
   * Uses explicit stream labels so it works with filter_complex_script.
   * Output is labeled [outv] for mapping.
   * NOTE: Only processes explicit CAPTION or TEXT actions. KEEP actions do not produce text.
   */
  generateFilterChain(actions = []) {
    const textActions = actions.filter((a) => a.type === "TEXT" || a.type === "CAPTION");
    if (textActions.length === 0) return null;

    let currentLabel = "[0:v]";
    const filters = textActions.map((act, index) => {
      const text = act.params?.text || act.note || `Point ${index + 1}`;
      const start = act.start || 0;
      const end = act.end || (start + 3);
      const nextLabel = `[v${index}]`;
      const filter = `${currentLabel}${this.generateDrawTextFilter(text, start, end)}${nextLabel}`;
      currentLabel = nextLabel;
      return filter;
    });

    // Final label to map to
    filters.push(`${currentLabel}null[outv]`);

    return filters.join(";");
  }
}

module.exports = { CaptionEngine };
