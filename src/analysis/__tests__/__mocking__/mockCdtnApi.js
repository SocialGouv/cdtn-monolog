import { triggerSearch } from "../../../cdtnApi";
import { api } from "./apiResults";

jest.mock("../../../cdtnApi");
triggerSearch.mockImplementation(
  (query) =>
    new Promise((resolve, fail) =>
      api.has(query) ? resolve(api.get(query)) : fail()
    )
);
