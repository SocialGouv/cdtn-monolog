import { Prequalified } from "../cdtn/cdtn.types";
import { QUERY_REPORT_INDEX } from "../es/elastic";
import { loadReport } from "../report/reportStore";
import { PQ } from "./queries";
import { QueryIndexReport } from "./reports";

export const prequalifiedAnalysis = async (
  prequalified: Prequalified[],
  report: QueryIndexReport
) => {
  const problems = report.problems.filter(({ type }) => type == PQ);

  const orderingProblems = problems.filter(
    ({ ndcg }) => parseFloat(ndcg) < 0.9
  );

  //   const ratioProblems = problems.filter(
  // ({ selectionRatio: r }) => parseFloat(r) < 0.5
  //   );

  const ordering = await Promise.all(
    orderingProblems.map(async (p) => {
      const matching = prequalified.filter((pr) =>
        pr.document.variants.includes(p.query)
      );
      let m: any = "no match";

      if (matching.length == 1) {
        const { id, cdtnId } = matching[0];
        m = { cdtnId, id };
      } else if (matching.length > 1) {
        m = "several matches";
      }

      const bestOrder = await loadReport(QUERY_REPORT_INDEX, {
        match: { queryName: p.query },
      })
        .then((res) => res.docs[0].results)
        .catch((err) => {
          console.log(err);
          return "cannot find query report";
        });

      return { ...p, bestOrder, matching: m };
    })
  );

  return { ordering };
};
