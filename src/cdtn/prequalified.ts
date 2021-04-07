import * as fs from "fs";

import { Prequalified } from "./cdtn.types";

export const readPrequalified = (
  filePath: string
): Promise<Array<Prequalified>> =>
  fs.promises
    .readFile(filePath)
    .then((data: any) => JSON.parse(data).data.documents as Prequalified[]);
