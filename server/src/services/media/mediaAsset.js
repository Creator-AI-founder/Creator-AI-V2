/**
 * Canonical Media Asset Contract
 *
 * Media providers, Media Director, asset resolver, timeline compiler,
 * video engine, and frontend should use this contract.
 */

const MEDIA_KINDS = new Set(["image", "video", "audio"]);
const MEDIA_ORIGINS = new Set([
  "real",
  "search",
  "ai_generated",
  "uploaded",
]);
const MEDIA_STATUSES = new Set(["planned", "ready", "failed"]);
const FACTUALITY_MODES = new Set([
  "factual",
  "illustrative",
  "creative",
]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateMediaAsset(asset) {
  if (!asset || typeof asset !== "object") {
    throw new Error("Media asset must be an object");
  }

  if (!isNonEmptyString(asset.id)) {
    throw new Error("Media asset missing id");
  }

  if (!MEDIA_KINDS.has(asset.kind)) {
    throw new Error(`Unsupported media kind: ${asset.kind}`);
  }

  if (!MEDIA_ORIGINS.has(asset.origin)) {
    throw new Error(`Unsupported media origin: ${asset.origin}`);
  }

  if (asset.status !== undefined && !MEDIA_STATUSES.has(asset.status)) {
    throw new Error(`Unsupported media status: ${asset.status}`);
  }

  if (
    asset.factuality !== undefined &&
    !FACTUALITY_MODES.has(asset.factuality)
  ) {
    throw new Error(`Unsupported factuality mode: ${asset.factuality}`);
  }

  if (asset.path !== undefined && !isNonEmptyString(asset.path)) {
    throw new Error(`Media asset ${asset.id} path must be a string`);
  }

  if (asset.url !== undefined && !isNonEmptyString(asset.url)) {
    throw new Error(`Media asset ${asset.id} url must be a string`);
  }

  if (
    asset.width !== undefined &&
    (!isFiniteNumber(asset.width) || asset.width <= 0)
  ) {
    throw new Error(`Media asset ${asset.id} width must be positive`);
  }

  if (
    asset.height !== undefined &&
    (!isFiniteNumber(asset.height) || asset.height <= 0)
  ) {
    throw new Error(`Media asset ${asset.id} height must be positive`);
  }

  if (
    asset.duration !== undefined &&
    (!isFiniteNumber(asset.duration) || asset.duration < 0)
  ) {
    throw new Error(`Media asset ${asset.id} duration must be non-negative`);
  }

  // Real/search media must retain provenance.
  if (asset.origin === "real" || asset.origin === "search") {
    if (!asset.source || typeof asset.source !== "object") {
      throw new Error(
        `Media asset ${asset.id} requires source metadata`
      );
    }

    if (!isNonEmptyString(asset.source.provider)) {
      throw new Error(
        `Media asset ${asset.id} source.provider is required`
      );
    }

    if (!isNonEmptyString(asset.source.sourceUrl)) {
      throw new Error(
        `Media asset ${asset.id} source.sourceUrl is required`
      );
    }
  }

  // AI-generated media must retain generation provenance.
  if (asset.origin === "ai_generated") {
    if (!asset.generation || typeof asset.generation !== "object") {
      throw new Error(
        `Media asset ${asset.id} requires generation metadata`
      );
    }

    if (!isNonEmptyString(asset.generation.provider)) {
      throw new Error(
        `Media asset ${asset.id} generation.provider is required`
      );
    }

    if (!isNonEmptyString(asset.generation.prompt)) {
      throw new Error(
        `Media asset ${asset.id} generation.prompt is required`
      );
    }
  }

  return true;
}

function validateMediaAssets(assets) {
  if (!Array.isArray(assets)) {
    throw new Error("Media assets must be an array");
  }

  assets.forEach(validateMediaAsset);

  return true;
}

module.exports = {
  MEDIA_KINDS,
  MEDIA_ORIGINS,
  MEDIA_STATUSES,
  FACTUALITY_MODES,
  validateMediaAsset,
  validateMediaAssets,
};
