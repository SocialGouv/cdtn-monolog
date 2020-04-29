export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  return url.slice(SERVICE_URL.length);
};

export const actionTypes = {
  visitType: "visit_content",
  selectSuggestionType: "select_suggestion",
};
