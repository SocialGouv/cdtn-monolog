import { MatomoAction, MonologActionFields } from "./ingestion.types";

const parseSearch = (action: MatomoAction): MonologActionFields => ({
  type: "search",
  query: action.subtitle,
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
        type: "select_suggestion",
        suggestionPrefix: action.eventAction,
        suggestionSelection: action.eventName,
      };
    }
    case "feedback": {
      return {
        type: "feedback",
        feedbackType: action.eventAction,
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
        type: "result_candidates",
        query: action.eventAction,
      };
    }
    case "nextResultPage": {
      return {
        type: "next_result_page",
        query: action.eventAction,
      };
    }
    case "selectResult": {
      return {
        type: "select_result",
        resultSelection: JSON.parse(action.eventAction),
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
      return { type: "theme_candidates", query: action.eventAction };
    }
    case "outil": {
      const outilAction = action.eventAction.startsWith("view_step_")
        ? "view_step"
        : "click_previous";
      const outil = action.eventAction.slice(
        action.eventAction.lastIndexOf("_") + 1
      );
      const outilEvent = action.eventName;

      return { type: "outil", outil, outilEvent, outilAction };
    }
    case "cc_search": {
      return {
        type: action.eventCategory,
        query: action.eventName,
        ccAction: action.eventAction,
      };
    }
    case "cc_select": {
      return {
        type: action.eventCategory,
        cc: action.eventName,
        ccAction: action.eventAction,
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
