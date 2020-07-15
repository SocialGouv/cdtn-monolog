export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  if (url.startsWith(SERVICE_URL)) {
    return url.slice(SERVICE_URL.length);
  } else {
    return url;
  }
};

export const actionTypes = {
  selectSuggestionType: "select_suggestion",
  visitType: "visit_content",
  search: "search",
  home: "home",
  themes: "themes",
  selectRelated: "selectRelated"
};
