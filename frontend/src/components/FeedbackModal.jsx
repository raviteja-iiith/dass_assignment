import { useState } from "react";
import API from "../services/api";

function FeedbackModal({ eventId, eventName, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (comment.trim().length === 0) {
      alert("Please provide a comment");
      return;
    }

    setSubmitting(true);
    try {
      await API.post(`/events/${eventId}/feedback`, { rating, comment });
      alert("Thank you for your feedback!");
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="bg-base-100 rounded-lg shadow-2xl w-full max-w-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b">
            <h3 className="font-bold text-2xl">Submit Feedback</h3>
            <p className="text-sm opacity-70 mt-1">Event: {eventName}</p>
          </div>

          <div className="p-6">
            {/* Star Rating */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">
                  Your Rating <span className="text-error">*</span>
                </span>
              </label>
              <div className="flex gap-2 items-center flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-4xl transition-all ${
                      (hoveredRating || rating) >= star
                        ? "text-warning"
                        : "text-base-300"
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-4 text-lg font-semibold">
                    {rating} {rating === 1 ? "Star" : "Stars"}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-semibold">
                  Your Comments <span className="text-error">*</span>
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 w-full"
                placeholder="Share your experience with this event..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                required
              />
              <label className="label">
                <span className="label-text-alt">
                  {comment.length}/1000 characters
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`btn btn-primary ${submitting ? "loading" : ""}`}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
