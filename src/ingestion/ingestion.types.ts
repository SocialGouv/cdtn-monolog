type RootAction = {
  url: string;
  timeSpent: number;
  timestamp: number;
};

type MonologFields = {
  uvi: number;
  logfile: string;
};

type VisitFields = {
  idVisit: number;
  serverTimePretty: number;
  referrerTypeName: string;
  referrerName: string;
  lastActionTimestamp: number;
  lastActionDateTime: number;
};

type MatomoAction = RootAction & {
  // update
  type: string;
  subtitle: string;

  // no
  eventCategory: string;
  eventAction: string;
  eventName: string;
};

type MatomoVisit = VisitFields & {
  actionDetails: MatomoAction[];
};

type MonologActionFields = {
  type: string;

  // additional fields for Monolog format
  query?: string;
  suggestionPrefix?: string;
  suggestionSelection?: string;
  suggestionCandidates?: string[];

  feedbackType?: string;
  visited?: string;
  resultSelection?: string;
  recoType?: string;
  recoSelection?: string;

  outilAction?: string;
  outil?: string;
  outilEvent?: string;

  cc?: string;
  ccAction?: string;
};

type MonologAction = VisitFields &
  RootAction &
  MonologActionFields &
  MonologFields;
