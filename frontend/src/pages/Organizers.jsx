import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Organizers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [followedOrganizers, setFollowedOrganizers] = useState([]);

  useEffect(() => {
    fetchOrganizers();
    if (user?.role === "participant") {
      fetchProfile();
    }
  }, [search, category]);

  const fetchOrganizers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      
      const { data } = await API.get(`/participant/organizers?${params.toString()}`);
      setOrganizers(data);
    } catch (error) {
      console.error("Failed to fetch organizers:", error);
      alert(error.response?.data?.error || "Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/participant/profile");
      setFollowedOrganizers(data.followedOrganizers?.map(o => o._id) || []);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // Not critical if this fails
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      await API.post(`/participant/follow/${organizerId}`);
      setFollowedOrganizers([...followedOrganizers, organizerId]);
      alert("Organizer followed successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to follow organizer");
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      await API.delete(`/participant/follow/${organizerId}`);
      setFollowedOrganizers(followedOrganizers.filter(id => id !== organizerId));
      alert("Organizer unfollowed successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to unfollow organizer");
    }
  };

  const isFollowing = (organizerId) => followedOrganizers.includes(organizerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Clubs & Organizers</h1>
        <p className="text-lg opacity-70">Discover and follow event organizers</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Search Organizers</span>
          </label>
          <input
            type="text"
            placeholder="Search by name or description..."
            className="input input-bordered"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Category</span>
          </label>
          <select
            className="select select-bordered"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Literary">Literary</option>
            <option value="Social">Social</option>
            <option value="Academic">Academic</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg opacity-70">{organizers.length} organizer(s) found</p>
        {user?.role === "participant" && (
          <p className="text-sm opacity-60">
            Following {followedOrganizers.length} organizer(s)
          </p>
        )}
      </div>

      {/* Organizers Grid */}
      {organizers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizers.map(organizer => (
            <div 
              key={organizer._id} 
              className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all cursor-pointer"
              onClick={() => navigate(`/organizers/${organizer._id}`)}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-16">
                      <span className="text-2xl">{organizer.organizerName?.charAt(0)}</span>
                    </div>
                  </div>
                  {organizer.category && (
                    <div className="badge badge-secondary">{organizer.category}</div>
                  )}
                </div>

                <h2 className="card-title mt-2">{organizer.organizerName}</h2>
                
                {organizer.description && (
                  <p className="text-sm opacity-70 line-clamp-3">{organizer.description}</p>
                )}

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="opacity-60">Events</p>
                    <p className="font-semibold">{organizer.eventCount || 0}</p>
                  </div>
                  {organizer.contactEmail && (
                    <div>
                      <p className="opacity-60">Contact</p>
                      <p className="font-semibold text-xs truncate">{organizer.contactEmail}</p>
                    </div>
                  )}
                </div>

                {user?.role === "participant" && (
                  <div className="card-actions justify-end mt-4">
                    {isFollowing(organizer._id) ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(organizer._id);
                        }}
                        className="btn btn-outline btn-sm w-full"
                      >
                        ✓ Following
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(organizer._id);
                        }}
                        className="btn btn-primary btn-sm w-full"
                      >
                        + Follow
                      </button>
                    )}
                  </div>
                )}

                {organizer.discordWebhook && (
                  <div className="alert alert-info mt-2 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Discord notifications enabled</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
          <p className="text-lg opacity-60 mb-4">No organizers found</p>
          <p className="text-sm opacity-50">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
}

export default Organizers;
