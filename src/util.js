export const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  if (url.startsWith(SERVICE_URL)) {
    return url.slice(SERVICE_URL.length);
  } else {
    return url;
  }
};

export const formatDate = (date) => date.toISOString().split("T")[0];

// get last n days before ref
export const getLastDays = (n, ref) => {
  // a day in milliseconds
  const dayMillis = 24 * 60 * 60 * 1000;

  const createDate = (i) => new Date(ref.getTime() - (i + 1) * dayMillis);

  return [...Array(n).keys()].map(createDate).map(formatDate);
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
