import * as fs from "fs";
import * as readline from "readline";

/**
 * Read suggestions used by CDTN
 * @param filePath CDTN suggestions file
 */
export const readSuggestions = async (
  filePath: string
): Promise<Set<string>> => {
  const entities: Set<string> = new Set();

  const promiseStream = new Promise<void>((resolve) => {
    const stream = readline.createInterface({
      input: fs.createReadStream(filePath),
    });

    let suggestionsBuffer: any[] = [];
    stream.on("line", async function (line) {
      // parse JSON representing a suggestion entity {entity: suggestion, value: weight}
      const entity = JSON.parse(line);
      suggestionsBuffer.push(entity);
      if (suggestionsBuffer.length >= 2048) {
        // create an immutable copy of the array
        const suggestions = suggestionsBuffer.slice();
        suggestionsBuffer = [];
        suggestions.forEach((s) => entities.add(s.entity));
      }
    });

    stream.on("close", async function () {
      if (suggestionsBuffer.length > 0) {
        suggestionsBuffer.forEach((s) => entities.add(s.entity));
        resolve();
      }
    });
  });

  await promiseStream;
  return entities;
};
