import fetch from "node-fetch";

const CDTN_API =
  process.env.CDTN_API ||
  "https://api-master-code-travail.dev2.fabrique.social.gouv.fr";

const path = "/api/v1/search";

/**
 *
 * @param {string} query
 */
export const triggerSearch = (query) => {
  const url = `${CDTN_API}${path}?q=${encodeURIComponent(query)}`;

  return fetch(url)
    .then((res) => res.json())
    .catch((err) => console.log(err));

  // const docs = result.documents;
  // return { docs, query };
};
