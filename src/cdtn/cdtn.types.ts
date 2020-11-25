import { SourceRoute } from "@socialgouv/cdtn-sources";

type Article = {
  _score: number;
  cdtnId: string;
  description: string;
  slug: string;
  source: string;
  title: string;
  url: string;
};

type Document = {
  _score: number;
  algo: string;
  breadcrumbs: { label: string; slug: string }[];
  cdtnId: string;
  description: string;
  slug: string;
  source: SourceRoute;
  title: string;
  url: string;
};

type Theme = {
  _score: number;
  algo: string;
  breadcrumbs?: { label: string; slug: string }[];
  slug: string;
  source: string;
  title: string;
};

type SearchResult = {
  articles: Article[];
  documents: Document[];
  themes: Theme[];
};

// Query cluser to group queries with similar results from the API
type CacheQueryCluster = {
  // the different queries returning the same results
  queries: string[];
  // the document results : Map<documentPath, {algo: fulltext|prequalified|semantic, cdtnId}>
  results: Map<string, { algo: string; cdtnId: string }>;
};

type Cache = {
  clusters: Map<number, CacheQueryCluster>;
  queryMap: Map<string, number>;
};

export { Document, SearchResult, Cache, CacheQueryCluster };
