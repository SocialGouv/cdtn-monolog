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
  selectRelated: "selectRelated",
  selectSuggestionType: "select_suggestion",
  themes: "themes",
  visitType: "visit_content",
};
