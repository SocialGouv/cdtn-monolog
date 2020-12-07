import { MatomoAction, MonologActionFields } from "./ingestion.types";

const parseSearch = (action: MatomoAction): MonologActionFields => ({
  query: action.subtitle,
  type: "search",
});

const parseStandard = (action: MatomoAction): MonologActionFields => {
  // TODO find a better way ot express this :
  const type = ((url) => {
    if (url.endsWith("gouv.fr/")) {
      return "home";
    } else if (url.includes("/themes/") || url.endsWith("/themes")) {
      return "themes";
    } else if (url.endsWith("/outils")) {
      return "outils";
    } else if (url.endsWith("/recherche")) {
      return "external_search";
    } else if (url.endsWith("/modeles-de-courriers")) {
      return "modeles_courriers";
    } else if (url.includes("?dclid=")) {
      return "unknown";
    } else {
      return "visit_content";
    }
  })(action.url);
  return { type };
};

const parseEvent = (action: MatomoAction): MonologActionFields => {
  switch (action.eventCategory) {
    case "selectedSuggestion": {
      return {
        suggestionPrefix: action.eventAction,
        suggestionSelection: action.eventName,
        type: "select_suggestion",
      };
    }
    case "feedback": {
      return {
        feedbackType: action.eventAction,
        type: "feedback",
        visited: action.eventName,
      };
    }
    case "candidateSuggestions": {
      return {
        type: "suggestion_candidates",
        // we do not keep suggestion candidates for now
        // suggestionCandidates: action.eventAction.split("###"),
      };
    }
    case "candidateResults": {
      return {
        query: action.eventAction,
        type: "result_candidates",
      };
    }
    case "nextResultPage": {
      return {
        query: action.eventAction,
        type: "next_result_page",
      };
    }
    case "selectResult": {
      return {
        resultSelection: JSON.parse(action.eventAction),
        type: "select_result",
      };
    }
    case "selectRelated": {
      // for now we have to deal with several formats
      try {
        const actionParsed = JSON.parse(action.eventAction);
        return {
          recoSelection: actionParsed.selection,
          recoType: actionParsed.reco,
          type: "select_related",
        };
      } catch (err) {
        return {
          recoSelection: action.eventAction,
          recoType: "search",
          type: "select_related",
        };
      }
    }
    case "themeResults": {
      return { query: action.eventAction, type: "theme_candidates" };
    }
    case "outil": {
      const outilAction = action.eventAction.startsWith("view_step_")
        ? "view_step"
        : "click_previous";
      const outil = action.eventAction.slice(
        action.eventAction.lastIndexOf("_") + 1
      );
      const outilEvent = action.eventName;

      return { outil, outilAction, outilEvent, type: "outil" };
    }
    case "cc_search": {
      return {
        ccAction: action.eventAction,
        query: action.eventName,
        type: action.eventCategory,
      };
    }
    case "cc_select": {
      return {
        cc: action.eventName,
        ccAction: action.eventAction,
        type: action.eventCategory,
      };
    }
    default: {
      return {
        type: action.eventCategory,
      };
    }
  }
};

export { parseEvent, parseSearch, parseStandard };
