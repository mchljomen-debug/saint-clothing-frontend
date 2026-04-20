import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StarRating = ({ value = 0, onChange = null, size = 'text-base' }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          className={`${size} ${onChange ? 'cursor-pointer' : 'cursor-default'} ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({
  productId,
  reviews = [],
  backendUrl,
  token,
  user,
  canReview,
  onReviewAdded
}) => {
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isLoggedIn = !!user;

  // ✅ MASK NAME LIKE: rj**moli***
  const maskName = (name = "") => {
    if (!name) return "Verified Buyer";

    const clean = name.trim();

    if (clean.length <= 4) {
      return clean.slice(0, 1) + "*".repeat(clean.length - 1);
    }

    const first = clean.slice(0, 2);        // rj
    const middle = clean.slice(2, clean.length - 3); // moli
    const last = clean.slice(-3);           // ina

    const maskedStart = "*".repeat(2);      // **
    const maskedEnd = "*".repeat(last.length); // ***

    return `${first}${maskedStart}${middle}${maskedEnd}`;
  };

  const hasUserReviewed = useMemo(() => {
    if (!user?._id || !Array.isArray(reviews)) return false;
    return reviews.some(
      (review) => String(review.userId) === String(user._id)
    );
  }, [reviews, user]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const effectiveCanReview = isLoggedIn && canReview && !hasUserReviewed;

  const submitReview = async () => {
    if (!isLoggedIn) {
      toast.error('Please login first');
      return;
    }

    if (!effectiveCanReview) {
      if (hasUserReviewed) {
        toast.error('You already reviewed this product');
      } else {
        toast.error('You can only review after your order is delivered');
      }
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write your review');
      return;
    }

    try {
      setSubmittingReview(true);

      const res = await axios.post(
        `${backendUrl}/api/product/review/${productId}`,
        {
          rating: Number(reviewRating),
          comment: reviewComment.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        toast.success('Review submitted successfully');
        setReviewComment('');
        setReviewRating(5);
        if (onReviewAdded) onReviewAdded();
      } else {
        toast.error(res.data.message || 'Failed to submit review');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10">
      {/* LEFT SIDE */}
      <div className="border rounded-xl p-6 bg-white">
        <p className="text-4xl font-black text-[#0A0D17]">{averageRating}</p>

        <div className="mt-3">
          <StarRating value={Math.round(Number(averageRating))} size="text-2xl" />
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase mb-4">Write a Review</p>

          {!isLoggedIn && (
            <p className="text-sm text-gray-500">
              Please login to write a review.
            </p>
          )}

          {isLoggedIn && hasUserReviewed && (
            <p className="text-sm text-gray-500">
              You already reviewed this product.
            </p>
          )}

          {isLoggedIn && !hasUserReviewed && !canReview && (
            <p className="text-sm text-gray-500">
              You can review this product after your order is delivered.
            </p>
          )}

          {effectiveCanReview && (
            <div className="space-y-4">
              <StarRating
                value={reviewRating}
                onChange={setReviewRating}
                size="text-2xl"
              />

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your thoughts about the product..."
                className="w-full border rounded-lg p-4 min-h-[120px] outline-none"
              />

              <button
                type="button"
                onClick={submitReview}
                disabled={submittingReview}
                className="bg-black text-white px-6 py-3 font-bold uppercase rounded-lg disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - REVIEWS */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="border rounded-xl p-6 text-gray-500 bg-white">
            No reviews yet.
          </div>
        )}

        {reviews.map((review, index) => (
          <div key={review._id || index} className="border rounded-xl p-6 bg-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                {/* ✅ MASKED NAME HERE */}
                <p className="font-bold text-[#0A0D17]">
                  {maskName(review.userName)}
                </p>

                <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : 'Recent'}
                </p>
              </div>

              <StarRating value={Number(review.rating || 0)} />
            </div>

            <p className="mt-4 text-gray-600 leading-7">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;