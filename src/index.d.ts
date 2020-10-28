export as namespace monolog

export type Report = {
  id: string
  text: string
}
export type Cache = Map<number, { queries: Map<string, number>; results: Map<any, any>; }>
