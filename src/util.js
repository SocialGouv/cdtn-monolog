export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  if (url.startsWith(SERVICE_URL)) {
    return url.slice(SERVICE_URL.length);
  } else {
    return url;
  }
};

export const actionTypes = {
  home: "home",
  search: "search",
  // FIXME: 28/07 should be changed to select_related in the near future
  // selectRelated: "selectRelated",
  selectRelated: "select_related",
  selectResult: "select_result",
  selectSuggestion: "select_suggestion",
  themes: "themes",
  visit: "visit_content",
};
