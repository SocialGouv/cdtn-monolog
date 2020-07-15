export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  if (url.startsWith(SERVICE_URL)) {
    return url.slice(SERVICE_URL.length);
  } else {
    return url;
  }
};

export const actionTypes = {
  visitType: "visit_content",
  selectSuggestionType: "select_suggestion",
  search: "search",
  home: "home",
  themes: "themes",
  selectRelated: "selectRelated"
};
