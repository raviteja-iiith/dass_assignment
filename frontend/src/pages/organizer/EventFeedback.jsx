import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

function EventFeedback() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("all");

  useEffect(() => {
    fetchEventAndFeedback();
  }, [eventId, filterRating]);

  const fetchEventAndFeedback = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventRes = await API.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Fetch feedback stats
      const statsRes = await API.get(`/events/${eventId}/feedback/stats`);
      setStats(statsRes.data);

      // Fetch individual feedbacks
      const feedbackParams = filterRating !== "all" ? `?rating=${filterRating}` : "";
      const feedbackRes = await API.get(`/events/${eventId}/feedback${feedbackParams}`);
      setFeedbacks(feedbackRes.data);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
      alert(error.response?.data?.error || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${star <= rating ? "text-warning" : "text-base-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold">Event Feedback</h1>
          <p className="text-lg opacity-70">{event?.eventName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average Rating */}
        <div className="card bg-gradient-to-br from-warning/20 to-warning/5 shadow-xl border border-warning/20">
          <div className="card-body">
            <h3 className="card-title text-sm opacity-70">Average Rating</h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-warning">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </div>
              <div>{renderStars(Math.round(stats?.averageRating || 0))}</div>
            </div>
          </div>
        </div>

        {/* Total Feedbacks */}
        <div className="card bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl border border-primary/20">
          <div className="card-body">
            <h3 className="card-title text-sm opacity-70">Total Feedbacks</h3>
            <div className="text-5xl font-bold text-primary">
              {stats?.totalFeedbacks || 0}
            </div>
            <p className="text-sm opacity-70">responses received</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h3 className="card-title text-sm opacity-70">Rating Distribution</h3>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-6">{rating}★</span>
                  <div className="flex-1 h-4 bg-base-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning transition-all"
                      style={{
                        width: stats?.totalFeedbacks
                          ? `${(stats.ratingDistribution[rating] / stats.totalFeedbacks) * 100}%`
                          : "0%"
                      }}
                    ></div>
                  </div>
                  <span className="w-8 text-right opacity-70">
                    {stats?.ratingDistribution?.[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          className={`btn btn-sm ${filterRating === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilterRating("all")}
        >
          All Ratings
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            className={`btn btn-sm ${filterRating === rating.toString() ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterRating(rating.toString())}
          >
            {rating} ★
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body text-center py-12">
              <p className="text-lg opacity-70">
                {filterRating === "all"
                  ? "No feedback received yet"
                  : `No ${filterRating}-star feedback found`}
              </p>
            </div>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div
              key={feedback._id}
              className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {renderStars(feedback.rating)}
                  </div>
                  <div className="text-sm opacity-60">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {feedback.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EventFeedback;
