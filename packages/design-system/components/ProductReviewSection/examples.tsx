import { ProductReviewSection } from "./ProductReviewSection";

export function ProductReviewSectionExample() {
  return (
    <ProductReviewSection
      title="Reviews"
      reviewCount={1}
      averageRating={5}
      ratingDistribution={[{ stars: 5, percentage: 100, count: 1 }]}
      reviews={[
        {
          id: "review-1",
          rating: 5,
          reviewer: "Customer***",
          body: "Comfortable, hydrating, and easy to use.",
          verifiedPurchase: true,
        },
      ]}
      copy={{
        reviewsLabel: "Reviews",
        writeReview: "Write a review",
        all: "All",
        purchased: "Purchased",
        photos: "Photos",
        sortBy: "Sort by",
        viewMore: "View more",
        verifiedPurchase: "Verified purchase",
        currentItem: "Current item",
        showOriginal: "Show original",
        helpful: "Helpful",
        comments: "Comments",
        noReviews: "No reviews match this filter.",
      }}
      sortOptions={[{ value: "default", label: "Default" }]}
    />
  );
}
