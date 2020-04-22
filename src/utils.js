export const commaSeparatedIntList = (value) =>
  value.split(",").map((i) => parseInt(i));

export const commaSeparatedList = (value) => value.split(",");

const SERVICE_URL = "https://code.travail.gouv.fr/";

export const urlToPath = (url) => {
  return url.slice(SERVICE_URL.length);
};

export const visitType = "visit_content";
export const suggestionSelectionType = "suggestion_selection";
