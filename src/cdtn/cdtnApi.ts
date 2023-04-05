import fetch from "node-fetch";

import { SearchResult } from "./cdtn.types";

const CDTN_API_URL = process.env.CDTN_API_URL;

if (!CDTN_API_URL) {
  throw new Error("missing CDTN_API_URL environment variable");
}

const path = "/api/search";

export const triggerSearch = (query: string): Promise<SearchResult> => {
  console.log(query);
  const url = `${CDTN_API_URL}${path}?q=${encodeURIComponent(query)}`;

  return fetch(url).then((res) => res.json());
  // .catch((err) => console.log(err));
};
