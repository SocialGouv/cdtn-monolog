import { queryAndWrite } from "../reader/logReader";

const generate_query_to_get_logs_from_url_outil_for_a_given_date = (
  day: string
) => {
  return {
    bool: {
      must: {
        prefix: {
          url: "https://code.travail.gouv.fr/outils",
        },
      },
      should: {
        match: { logfile: day },
      },
    },
  };
};

export const readDaysAndWriteKpi = async (
  index: string,
  days: string[],
  outputFolderName: string
): Promise<void> => {
  const queries = days.map((day) =>
    generate_query_to_get_logs_from_url_outil_for_a_given_date(day)
  );
  const queries_and_days = queries.map((q, i) => ({
    day: days[i],
    query: q,
  }));

  await Promise.all(
    queries_and_days.map((query_days) =>
      queryAndWrite(
        index,
        query_days.day,
        query_days.query,
        outputFolderName,
        []
      )
    )
  );
  return;
};
