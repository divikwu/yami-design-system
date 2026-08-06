import { TrendingSearches } from "./TrendingSearches";
import { createTrendingSearchesProps } from "./fixtures";

export function TrendingSearchesExample() {
  return <TrendingSearches {...createTrendingSearchesProps("en")} />;
}
