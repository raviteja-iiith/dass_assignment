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
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="relative">
          <span className="loading loading-spinner loading-lg text-primary scale-150"></span>
          <div className="absolute inset-0 animate-ping">
            <span className="loading loading-spinner loading-lg text-primary opacity-30"></span>
          </div>
        </div>
        <p className="text-xl font-semibold animate-pulse text-gradient">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header with animation */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-5xl font-bold mb-3 text-gradient">
          Discover Events
        </h1>
        <p className="text-xl opacity-80">Find and register for amazing tech events</p>
      </div>

      {/* Trending Section */}
      {trending.length > 0 && (
        <div className="mb-10 animate-slide-in-right">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span className="animate-pulse">🔥</span> Trending Now
            </h2>
            <div className="badge badge-error gap-2 animate-pulse shadow-lg shadow-error/50">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-error opacity-75"></span>
              HOT
            </div>
          </div>
          <div className="carousel carousel-center bg-gradient-to-r from-base-200/50 to-base-300/30 rounded-box p-4 space-x-4 shadow-2xl backdrop-blur-sm border border-primary/20">
            {trending.map((event, index) => (
              <div 
                key={event._id} 
                className="carousel-item w-80 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-2xl mb-10 border border-primary/30 animate-fade-in hover:shadow-primary/20 transition-all">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-primary">🎛️</span> Filters
            </h3>
            <button 
              onClick={clearFilters} 
              className="btn btn-ghost btn-sm hover:btn-error transition-all hover:scale-105"
            >
              ✕ Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="form-control animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <label className="label">
                <span className="label-text font-semibold">🔍 Search</span>
              </label>
              <input
                type="text"
                placeholder="Event name, tags..."
                className="input input-bordered focus:input-primary hover:border-primary/50 transition-all"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Event Type */}
            <div className="form-control animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <label className="label">
                <span className="label-text font-semibold">📊 Event Type</span>
              </label>
              <select
                className="select select-bordered focus:select-primary hover:border-primary/50 transition-all"
                value={filters.eventType}
                onChange={(e) => handleFilterChange("eventType", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="normal">Normal Events</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>

            {/* Eligibility */}
            <div className="form-control animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <label className="label">
                <span className="label-text font-semibold">🎓 Eligibility</span>
              </label>
              <select
                className="select select-bordered focus:select-primary hover:border-primary/50 transition-all"
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
            <div className="form-control animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
              <label className="label">
                <span className="label-text font-semibold">⚡ Sort By</span>
              </label>
              <select
                className="select select-bordered focus:select-primary hover:border-primary/50 transition-all"
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
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-primary">🎪</span> All Events
          </h2>
          <div className="badge badge-primary badge-lg shadow-lg shadow-primary/50 animate-pulse">
            {events.length} events found
          </div>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <div 
                key={event._id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-16 border-2 border-dashed border-primary/30 rounded-2xl bg-base-200/30 backdrop-blur-sm animate-scale-in hover:border-primary/50 transition-all">
            <div className="text-7xl mb-6 animate-float">🔍</div>
            <p className="text-2xl font-bold mb-3 text-gradient">No events found</p>
            <p className="opacity-70 mb-6 text-lg">Try adjusting your filters to discover more events</p>
            <button 
              onClick={clearFilters} 
              className="btn btn-primary btn-lg hover:scale-105 transition-all shadow-lg shadow-primary/50"
            >
              ✨ Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseEvents;