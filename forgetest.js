const dataForge = require("data-forge");

const a = ["hey", { count: 2, key: "key2" }];

console.log(a.sort((a, b) => b.count - a.count));
console.log(a.map((a, b) => a.key + b.key));

const df = new dataForge.DataFrame([
  { A: "10", g: 1, s: "positive" },
  { A: "20", g: 1, s: "positive" },
  { A: "30", g: 2, s: "negative" },
  { A: "40", g: 2, s: "negative" },
  { A: "11", g: 2, s: "negative" },
]);
console.log(
  df.parseFloats("A").aggregate({ A: 0, g: 0 }, (prev, next) => {
    return {
      TotalSales: prev.A + next.A,
    };
  })
);
console.log(
  df
    .parseFloats("A")
    .where((x) => x !== undefined)
    .deflate((x) => x.A)
    .average()
);

console.log(
  df
    .groupBy((row) => row.g)
    .select((group) => {
      return {
        pos_count: group.where((row) => row.s == "positive").count(),
        url: group.select((g) => g.A).first(),
      };
    })
    .toArray()
);
console.log(df.select((row) => row.g).getIndex().toArray());
df.toArray()