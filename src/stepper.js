import * as logstashClient from "./logstash/logstashClient";

export const selectSuggStep = "select_suggestion";
export const selectResStep = "select_result";
export const searchStep = "search";
const suggCandidatesStep = "suggestion_candidates";
const resCandidatesStep = "result_candidates";
const feedbackStep = "feedback";
const visitStep = "visit";
const homeStep = "home";

const shorten = (str, len = 30) =>
  str.length > len ? str.substr(0, len - 1) + "..." : str;

const addSuggestionRank = visit => {
  // this is ugly for now as suggestion and candidates events are not always ordered in the same way
  let current_sugg;
  let unconsumed_candidates;

  for (const step of visit) {
    if (step._source.type === selectSuggStep) {
      current_sugg = step;
      // case there was already a candidates list
      if (unconsumed_candidates) {
        current_sugg._source.rank = unconsumed_candidates._source.suggestion_candidates.indexOf(
          current_sugg._source.selection
        );
        current_sugg._source.candidates =
          unconsumed_candidates._source.suggestion_candidates;
        current_sugg = undefined;
        unconsumed_candidates = undefined;
      }
    } else if (step._source.type === suggCandidatesStep) {
      if (current_sugg != undefined) {
        current_sugg._source.rank = step._source.suggestion_candidates.indexOf(
          current_sugg._source.selection
        );
        current_sugg._source.candidates = step._source.suggestion_candidates;
        current_sugg = undefined;
      } else {
        // case candidates appears before selection
        unconsumed_candidates = step;
      }
    }
  }
};

const addSearchRank = visit => {
  let lastResultCandidatesDocs;

  for (const step of visit) {
    // we should only use select results here, for now dealing with visits as well
    if (step._source.type === visitStep) {
      const page = step._source.url.split("gouv.fr/")[1];
      // there is a transformation for the type
      const split = page.split("/");
      const transformed =
        split[0].replace(/-/g, "_").replace("fiche", "fiches") + "/" + split[1];
      if (lastResultCandidatesDocs != undefined)
        step._source.rank = lastResultCandidatesDocs.indexOf(transformed);
    } else if (step._source.type === selectResStep) {
      const selection = step._source.selection;
      const split = selection.split("/");
      const transformed =
        split[1].replace(/-/g, "_").replace("fiche", "fiches") + "/" + split[2];
      step._source.rank = lastResultCandidatesDocs.indexOf(transformed);
    } else if (step._source.type === resCandidatesStep) {
      lastResultCandidatesDocs = step._source.result_candidates.documents.map(
        // another transformation needed to match visit and candidates, not compatible with selectResult
        d => d //.split("#")[0]
      );
    }
  }
};

export const formatVisit = idVisit =>
  logstashClient.getVisitSteps(idVisit).then(steps => {
    if (steps.length == 0) {
      console.log("Cannot find logs for idVisit " + idVisit);
      return [];
    } else {
      // add rank to suggestions
      addSuggestionRank(steps);
      addSearchRank(steps);
      const agg = [];
      steps.forEach(step => {
        const values = step._source;
        switch (values.type) {
          case selectSuggStep:
            values.param1 = values.prefix;
            values.param2 = shorten(values.selection);
            values.param3 = values.rank;
            agg.push(values);
            break;
          case searchStep:
            values.param2 = shorten(values.query, 40);
            agg.push(values);
            break;
          case feedbackStep:
            agg.push(values);
            values.param1 = values.feedback_type;
            break;
          case visitStep: {
            agg.push(values);
            const page = values.url.split("gouv.fr/")[1].split("/");
            values.param1 = page[0];
            if (page[1] != undefined) values.param2 = shorten(page[1], 40);
            // values.param3 = values.rank;
            break;
          }
          case selectResStep: {
            agg.push(values);
            const selection = values.selection.split("/");
            values.param1 = selection[1];
            values.param2 = shorten(selection[2], 40);
            values.param3 = values.rank;
            break;
          }
          case homeStep:
            agg.push(values);
            break;
          default:
            agg.push(values);
        }
      });

      return agg;
    }
  });
