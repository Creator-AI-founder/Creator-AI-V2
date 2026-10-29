const {
  validateMediaAsset,
} = require("./mediaAsset");

function createPlannedAsset(scene, visualPlan) {
  const type =
    visualPlan.type === "IMAGE"
      ? "image"
      : visualPlan.type === "VIDEO"
        ? "video"
        : null;

  if (!type) {
    throw new Error(
      `Unsupported visual plan type: ${visualPlan.type}`
    );
  }

  const asset = {
    id: `planned_${scene.id}`,
    kind: type,
    origin:
      visualPlan.mode === "AI_GENERATED"
        ? "ai_generated"
        : visualPlan.mode === "UPLOAD"
          ? "uploaded"
          : "search",
    status: "planned",
    factuality: visualPlan.factuality || "illustrative",
  };

  if (visualPlan.mode === "REAL") {
    asset.source = {
      provider: "pending",
      sourceUrl: "pending",
      query: visualPlan.query || scene.visualQuery,
    };
  }

  if (visualPlan.mode === "AI_GENERATED") {
    asset.generation = {
      provider: "pending",
      model: "pending",
      prompt: visualPlan.prompt || scene.visualQuery,
      aspectRatio: "9:16",
    };
  }

  validateMediaAsset(asset);

  return asset;
}

async function resolveSceneMedia(scene, provider, options = {}) {
  if (!scene || typeof scene !== "object") {
    throw new Error("Scene must be an object");
  }

  const visualPlan = scene.visualPlan;

  if (!visualPlan || typeof visualPlan !== "object") {
    return {
      status: "skipped",
      reason: "Scene has no visualPlan",
      asset: null,
    };
  }

  /*
   * Planning mode is intentional for now.
   *
   * Real provider calls will be added after the resolver contract
   * is verified. This prevents provider-specific code from leaking
   * into the Director or video engine.
   */
  if (!provider) {
    return {
      status: "planned",
      reason: "No media provider configured",
      asset: createPlannedAsset(scene, visualPlan),
    };
  }

  if (visualPlan.mode === "REAL") {
    if (visualPlan.type === "IMAGE") {
      const results = await provider.searchImages(
        visualPlan.query || scene.visualQuery,
        options.count || 3
      );

      return {
        status: "candidates",
        assets: results || [],
      };
    }

    if (visualPlan.type === "VIDEO") {
      const results = await provider.searchVideos(
        visualPlan.query || scene.visualQuery,
        options.count || 3
      );

      return {
        status: "candidates",
        assets: results || [],
      };
    }
  }

  if (visualPlan.mode === "AI_GENERATED") {
    if (visualPlan.type === "IMAGE") {
      const asset = await provider.generateImage(
        visualPlan.prompt || scene.visualQuery,
        {
          aspectRatio: "9:16",
          duration: scene.end - scene.start,
        }
      );

      return {
        status: asset ? "ready" : "unavailable",
        asset: asset || null,
      };
    }

    if (visualPlan.type === "VIDEO") {
      const asset = await provider.generateVideo(
        visualPlan.prompt || scene.visualQuery,
        {
          aspectRatio: "9:16",
          duration: scene.end - scene.start,
        }
      );

      return {
        status: asset ? "ready" : "unavailable",
        asset: asset || null,
      };
    }
  }

  if (visualPlan.mode === "UPLOAD") {
    return {
      status: "unavailable",
      reason: "Upload asset resolution is not implemented yet",
      asset: null,
    };
  }

  throw new Error(
    `Unsupported visual plan mode: ${visualPlan.mode}`
  );
}

module.exports = {
  createPlannedAsset,
  resolveSceneMedia,
};
