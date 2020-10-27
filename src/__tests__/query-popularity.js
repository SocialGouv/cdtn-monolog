/**
 * Step 1 - Build search engine cache :
 * - query clusters : id + list of queries + API ordered results
 * - query map : query -> cluster id
 */

// eslint-disable-next-line no-unused-vars
const getQueries = () => {};

/**
 *
 * @param {string[]} logQueries
 * @returns {Promise<string>}
 */
const step1 = (logQueries) => {
  return new Promise((resolve) => resolve(logQueries[0]));
};

/**
 * Step 2 - Compute popularity board for given period + reference
 * - group and count queries using clusters
 * - compute popularity board like the content board
 */

step1(["q1", "q2"])
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
