import { DataFrame, IDataFrame } from "data-forge";

export const joinOuter3DfOnFieldColumn = (df1: IDataFrame, df2: IDataFrame, df3: IDataFrame): IDataFrame => {
  const newDf1 = df1.select((row) => {
    return {
      field: row.field,
      m0_count: row.count,
      m0_norm_count: row.normalized_count,
      m1_count: 0,
      m1_norm_count: 0,
      m2_count: 0,
    };
  });
  const newDf2 = df2.select((row) => {
    return {
      field: row.field,
      m0_count: 0,
      m0_norm_count: 0,
      m1_count: row.count,
      m1_norm_count: row.normalized_count,
      m2_count: 0,
    };
  });
  const newDf3 = df3.select((row) => {
    return {
      field: row.field,
      m0_count: 0,
      m0_norm_count: 0,
      m1_count: 0,
      m1_norm_count: 0,
      m2_count: row.count,
    };
  });

  const concatenated = DataFrame.concat([newDf1, newDf2, newDf3]);

  return concatenated
    .groupBy((row) => row.field)
    .select((group) => ({
      field: group.first().field,
      m0_count: group.deflate((row) => row.m0_count).max(),
      m0_norm_count: group.deflate((row) => row.m0_norm_count).max(),
      m1_count: group.deflate((row) => row.m1_count).max(),
      m1_norm_count: group.deflate((row) => row.m1_norm_count).max(),
      m2_count: group.deflate((row) => row.m2_count).max(),
    }))
    .inflate();
};
