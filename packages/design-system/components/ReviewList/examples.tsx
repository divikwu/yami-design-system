import { ReviewList } from "./ReviewList";
import { createReviewListProps } from "./fixtures";

export const ReviewListExample = () => (
  <ReviewList {...createReviewListProps()} />
);
