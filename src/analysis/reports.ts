export type Report = {
  reportId: string;
  reportType: string;
};

export type PopularityReport = Report & {
  doc: {
    m2_count: number;
    field: string;
    m0_count: number;
    m0_norm_count: number;
    m1_count: number;
    m1_norm_count: number;
  };
  m0_start: number;
  m1_start: number;
  m2_start: number;
};

type Query = {
  count: number;
  query: string;
  suggestion: boolean;
};

type Result = {
  algo: string;
  count: number;
  result: string;
};

export type QueryReport = Report & {
  queryKey: number;
  ndcg: number;
  idcg: number;
  dcg: number;
  queriesCount: number;
  selectionsCount: number;
  queries: Query[];
  results: Result[];
  selectionsRatio: number;
  type: string;
};

export type ResultReport = Report &
  Result & {
    queries: Query[];
  };

export type QueryIndexReport = Report & {
  meanQueryCount: string;
  meanSelectionCount: string;
  ndcg: string;
  prequalified: {
    clusters: number;
    meanQueryCount: string;
    meanSelectionCount: string;
    ndcg: string;
    queryCount: number;
    selectionCount: number;
    selectionRatio: string;
  };
  problems: {
    ndcg: string;
    queriesCount: number;
    query: string;
    selectionCount: number;
    selectionRatio: string;
    type: string;
  }[];
  search: {
    clusters: number;
    meanQueryCount: string;
    meanSelectionCount: string;
    ndcg: string;
    queryCount: number;
    selectionCount: number;
    selectionRatio: string;
  };
  sumQueriesCount: number;
  sumSelectionCount: number;
};

export type MonthlyReport = Report & {
  averageDailyVisits: number;
  endDate: number;
  maxDailyVisits: number;
  maxDailyVisitsDay: number;
  nbVisits: number;
  startDate: number;
};

export type CovisiteReport = Report & {
  content: string;
  links: { count: number; link: string }[];
};

export type satisfactionReport = Report & {
  feedback_ratio: number;
  feed_positive: number;
  feed_negative: number;
  page_name: string;
  bounce_rate: number;
  page_views: number;
  time_spent: number;
  content_type: string;
  exit_rate: number;
  select_related_rate: number;
  start_analysis: number;
  end_analysis: number;
  // provenance.
  // destination.
  // outlinks.
};
