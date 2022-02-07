import fetch from "node-fetch";

import { SearchResult } from "./cdtn.types";

const CDTN_API_URL =
  process.env.CDTN_API_URL ||
  "https://api-code-du-travail-numerique-preprod.dev.fabrique.social.gouv.fr";

const path = "/api/v1/search";

export const triggerSearch = (query: string): Promise<SearchResult> => {
  console.log(query);
  const url = `${CDTN_API_URL}${path}?q=${encodeURIComponent(query)}`;

  return fetch(url).then((res) => res.json());
  // .catch((err) => console.log(err));
};
