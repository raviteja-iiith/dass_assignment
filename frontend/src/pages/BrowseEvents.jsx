import { useEffect, useState } from "react";
import API from "../services/api";
import EventCard from "../components/EventCard";

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    eventType: "",
    eligibility: "",
    sortBy: "recent"
  });

  useEffect(() => {
    fetchEvents();
    fetchTrending();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.eventType) params.append("eventType", filters.eventType);
      if (filters.eligibility) params.append("eligibility", filters.eligibility);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const { data } = await API.get(`/events?${params.toString()}`);
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const { data } = await API.get("/events/trending");
      setTrending(data);
    } catch (error) {
      console.error("Failed to fetch trending:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      eventType: "",
      eligibility: "",
      sortBy: "recent"
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
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Events</h1>
        <p className="text-lg opacity-70">Find and register for amazing events</p>
      </div>

      {/* Trending Section */}
      {trending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">🔥 Trending Now</h2>
            <div className="badge badge-error">HOT</div>
          </div>
          <div className="carousel carousel-center bg-base-200 rounded-box p-4 space-x-4 shadow-inner">
            {trending.map(event => (
              <div key={event._id} className="carousel-item w-80">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl mb-8 border border-base-300">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Filters</h3>
            <button onClick={clearFilters} className="btn btn-ghost btn-sm">
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Search</span>
              </label>
              <input
                type="text"
                placeholder="Event name, tags..."
                className="input input-bordered focus:input-primary"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Event Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Event Type</span>
              </label>
              <select
                className="select select-bordered focus:select-primary"
                value={filters.eventType}
                onChange={(e) => handleFilterChange("eventType", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="normal">Normal Events</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>

            {/* Eligibility */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Eligibility</span>
              </label>
              <select
                className="select select-bordered focus:select-primary"
                value={filters.eligibility}
                onChange={(e) => handleFilterChange("eligibility", e.target.value)}
              >
                <option value="">All</option>
                <option value="IIIT-only">IIIT Only</option>
                <option value="Non-IIIT-only">Non-IIIT Only</option>
                <option value="all">Everyone</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Sort By</span>
              </label>
              <select
                className="select select-bordered focus:select-primary"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="relevant">Most Relevant</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Events</h2>
          <div className="badge badge-neutral badge-lg">{events.length} events found</div>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-semibold mb-2">No events found</p>
            <p className="opacity-60 mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseEvents;