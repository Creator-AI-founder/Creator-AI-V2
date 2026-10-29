const {
  validateMediaAsset,
} = require("./mediaAsset");

function scoreCandidate(asset, visualPlan = {}) {
  validateMediaAsset(asset);

  let score = 0;

  // Strong preference for the requested media type.
  if (
    visualPlan.type === "IMAGE" &&
    asset.kind === "image"
  ) {
    score += 30;
  }

  if (
    visualPlan.type === "VIDEO" &&
    asset.kind === "video"
  ) {
    score += 30;
  }

  // Factual scenes should strongly prefer real/search media.
  if (visualPlan.factuality === "factual") {
    if (
      asset.origin === "real" ||
      asset.origin === "search"
    ) {
      score += 40;
    } else if (asset.origin === "ai_generated") {
      score -= 40;
    }
  }

  // Creative scenes prefer generated media.
  if (visualPlan.factuality === "creative") {
    if (asset.origin === "ai_generated") {
      score += 30;
    }
  }

  // Illustrative scenes can use either.
  if (visualPlan.factuality === "illustrative") {
    score += 10;
  }

  // Provenance is valuable for real/search assets.
  if (
    (asset.origin === "real" || asset.origin === "search") &&
    asset.source
  ) {
    if (asset.source.provider) score += 5;
    if (asset.source.sourceUrl) score += 10;
    if (asset.source.license) score += 5;
    if (asset.source.creator) score += 5;
  }

  // Ready assets beat merely planned assets.
  if (asset.status === "ready") {
    score += 10;
  }

  if (asset.status === "planned") {
    score -= 20;
  }

  return score;
}

function selectBestMediaCandidate(
  candidates,
  visualPlan = {}
) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const scored = candidates.map((asset) => ({
    asset,
    score: scoreCandidate(asset, visualPlan),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0].asset;
}

function rankMediaCandidates(
  candidates,
  visualPlan = {}
) {
  if (!Array.isArray(candidates)) {
    throw new Error("Media candidates must be an array");
  }

  return candidates
    .map((asset) => ({
      asset,
      score: scoreCandidate(asset, visualPlan),
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  scoreCandidate,
  selectBestMediaCandidate,
  rankMediaCandidates,
};
