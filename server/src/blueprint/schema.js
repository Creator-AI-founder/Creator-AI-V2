/**
 * Canonical Action Schema Definition
 *
 * All system components (Director, Compiler, Engine, Frontend) must adhere
 * to these action types and structures.
 */

const ActionSchema = {
  KEEP: {
    params: {
      visualQuery: "string (optional)",
      visualType: "string (optional)",
    },
  },

  TRIM: {
    params: {
      sourceStart: "number",
      sourceEnd: "number",
    },
  },

  ZOOM: {
    params: {
      scaleFrom: "number (default 1.0)",
      scaleTo: "number",
    },
  },

  CAPTION: {
    params: {
      text: "string (non-empty)",
    },
  },

  IMAGE: {
    params: {
      assetId: "string",
    },
  },

  VIDEO: {
    params: {
      assetId: "string",
    },
  },

  BROLL: {
    params: {
      assetId: "string",
    },
  },
};

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validates a single canonical blueprint action.
 * Throws an Error with a descriptive message if invalid.
 */
function validateAction(action) {
  if (!action || typeof action !== "object") {
    throw new Error("Action must be an object");
  }

  if (!action.id || typeof action.id !== "string") {
    throw new Error("Action missing id");
  }

  if (!action.type || !ActionSchema[action.type]) {
    throw new Error(`Unsupported action type: ${action.type}`);
  }

  if (!isFiniteNumber(action.start) || !isFiniteNumber(action.end)) {
    throw new Error(`Invalid timeline for action ${action.id}`);
  }

  if (action.start < 0 || action.end <= action.start) {
    throw new Error(
      `Invalid timeline for action ${action.id}: start=${action.start}, end=${action.end}`
    );
  }

  const params = action.params || {};

  switch (action.type) {
    case "KEEP":
      if (
        params.visualQuery !== undefined &&
        typeof params.visualQuery !== "string"
      ) {
        throw new Error(`Action ${action.id} visualQuery must be a string`);
      }

      if (
        params.visualType !== undefined &&
        typeof params.visualType !== "string"
      ) {
        throw new Error(`Action ${action.id} visualType must be a string`);
      }
      break;

    case "TRIM":
      if (!isFiniteNumber(params.sourceStart)) {
        throw new Error(`Action ${action.id} sourceStart must be a number`);
      }

      if (!isFiniteNumber(params.sourceEnd)) {
        throw new Error(`Action ${action.id} sourceEnd must be a number`);
      }

      if (params.sourceStart < 0 || params.sourceEnd <= params.sourceStart) {
        throw new Error(`Action ${action.id} has invalid source trim range`);
      }
      break;

    case "ZOOM":
      if (
        params.scaleFrom !== undefined &&
        !isFiniteNumber(params.scaleFrom)
      ) {
        throw new Error(`Action ${action.id} scaleFrom must be a number`);
      }

      if (!isFiniteNumber(params.scaleTo)) {
        throw new Error(`Action ${action.id} scaleTo must be a number`);
      }

      if (params.scaleFrom !== undefined && params.scaleFrom <= 0) {
        throw new Error(`Action ${action.id} scaleFrom must be greater than 0`);
      }

      if (params.scaleTo <= 0) {
        throw new Error(`Action ${action.id} scaleTo must be greater than 0`);
      }
      break;

    case "CAPTION":
      if (typeof params.text !== "string" || params.text.trim().length === 0) {
        throw new Error(`Action ${action.id} caption text must be non-empty`);
      }
      break;

    case "IMAGE":
    case "VIDEO":
    case "BROLL":
      if (
        params.assetId !== null &&
        params.assetId !== undefined &&
        (typeof params.assetId !== "string" ||
          params.assetId.trim().length === 0)
      ) {
        throw new Error(
          `Action ${action.id} ${action.type} assetId must be a string or null`
        );
      }

      if (
        params.visualPlan !== undefined &&
        (!params.visualPlan ||
          typeof params.visualPlan !== "object")
      ) {
        throw new Error(
          `Action ${action.id} ${action.type} visualPlan must be an object`
        );
      }
      break;
  }

  return true;
}

/**
 * Validates a complete blueprint action array.
 */
function validateActions(actions) {
  if (!Array.isArray(actions)) {
    throw new Error("Blueprint actions must be an array");
  }

  actions.forEach(validateAction);

  return true;
}

module.exports = {
  ActionSchema,
  validateAction,
  validateActions,
};
