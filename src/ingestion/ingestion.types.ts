import {integer} from "@elastic/elasticsearch/api/types";

export type RootAction = {
  url: string;
  timeSpent: number;
  timestamp: number;
};

export type MonologFields = {
  uvi: number;
  logfile: string;
};

export type VisitFields = {
  idVisit: number;
  serverTimePretty: number;
  referrerTypeName: string;
  referrerName: string;
  lastActionTimestamp: number;
  lastActionDateTime: number;
};

export type MatomoAction = RootAction & {
  // update
  type: string;
  subtitle: string;

  // no
  eventCategory: string;
  eventAction: string;
  eventName: string;
};

export type MatomoVisit = VisitFields & {
  actionDetails: MatomoAction[];
};

export type MonologActionFields = {
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
  idCc?: number;
};

export type MonologAction = VisitFields &
  RootAction &
  MonologActionFields &
  MonologFields;
