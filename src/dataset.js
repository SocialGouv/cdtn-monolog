const AllVisitsDF = (dataframe) => ({
  getVisits() {
    return dataframe.groupBy((row) => row.uvi);
  },
});

export const Dataset = (dataframe) =>
  Object.assign(dataframe, AllVisitsDF(dataframe));
