import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizer, setOrganizer] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchOrganizerDetails();
    checkFollowStatus();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      const { data } = await API.get(`/participant/organizers/${id}`);
      setOrganizer(data.organizer);
      setUpcomingEvents(data.upcomingEvents);
      setPastEvents(data.pastEvents);
    } catch (error) {
      console.error("Failed to fetch organizer details:", error);
      alert("Failed to load organizer details");
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data } = await API.get("/participant/profile");
      const followed = data.followedOrganizers?.some(org => 
        (org._id || org).toString() === id
      );
      setIsFollowing(followed);
    } catch (error) {
      console.error("Failed to check follow status:", error);
    }
  };

  const handleFollow = async () => {
    try {
      await API.post(`/participant/follow/${id}`);
      setIsFollowing(true);
      alert("Organizer followed successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to follow organizer");
    }
  };

  const handleUnfollow = async () => {
    try {
      await API.delete(`/participant/follow/${id}`);
      setIsFollowing(false);
      alert("Organizer unfollowed successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to unfollow organizer");
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Organizer not found</h1>
        <button onClick={() => navigate("/organizers")} className="btn btn-primary">
          Back to Organizers
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {/* Organizer Header */}
      <div className="card bg-base-100 shadow-2xl border border-base-300 mb-8">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-24 h-24">
                <span className="text-4xl">{organizer.organizerName?.charAt(0)}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{organizer.organizerName}</h1>
                  <div className="badge badge-secondary badge-lg">{organizer.category}</div>
                </div>
                
                {user?.role === "participant" && (
                  <div>
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        className="btn btn-outline"
                      >
                        ✓ Following
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        className="btn btn-primary"
                      >
                        + Follow
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="divider my-4"></div>

              {/* Description */}
              {organizer.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="opacity-80">{organizer.description}</p>
                </div>
              )}

              {/* Contact */}
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${organizer.contactEmail}`} className="link link-primary">
                    {organizer.contactEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title mb-4">Events</h2>

          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <a
              className={`tab ${activeTab === "upcoming" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming ({upcomingEvents.length})
            </a>
            <a
              className={`tab ${activeTab === "past" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Past ({pastEvents.length})
            </a>
          </div>

          {/* Event List */}
          <div className="space-y-4">
            {activeTab === "upcoming" && (
              upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{event.eventName}</h3>
                          <p className="text-sm opacity-70 mt-1 line-clamp-2">{event.eventDescription}</p>
                          <div className="flex gap-2 mt-2">
                            <div className="badge badge-sm">
                              {event.eventType}
                            </div>
                            {event.eventTags?.slice(0, 3).map((tag, idx) => (
                              <div key={idx} className="badge badge-sm badge-outline">
                                {tag}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm opacity-60">Event Date</p>
                          <p className="font-semibold text-sm">{formatDate(event.eventStartDate)}</p>
                          {event.registrationFee > 0 && (
                            <p className="text-primary font-bold mt-1">₹{event.registrationFee}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-base-300 rounded-lg">
                  <p className="opacity-60">No upcoming events</p>
                </div>
              )
            )}

            {activeTab === "past" && (
              pastEvents.length > 0 ? (
                pastEvents.map(event => (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg opacity-75"
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{event.eventName}</h3>
                          <p className="text-sm opacity-70 mt-1 line-clamp-2">{event.eventDescription}</p>
                          <div className="flex gap-2 mt-2">
                            <div className="badge badge-sm">
                              {event.eventType}
                            </div>
                            <div className="badge badge-sm badge-ghost">
                              {event.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm opacity-60">Event Date</p>
                          <p className="font-semibold text-sm">{formatDate(event.eventStartDate)}</p>
                          {event.totalRegistrations > 0 && (
                            <p className="text-sm opacity-60 mt-1">
                              {event.totalRegistrations} registrations
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-base-300 rounded-lg">
                  <p className="opacity-60">No past events</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <button onClick={() => navigate("/organizers")} className="btn btn-ghost">
          ← Back to Organizers
        </button>
      </div>
    </div>
  );
}

export default OrganizerDetail;
