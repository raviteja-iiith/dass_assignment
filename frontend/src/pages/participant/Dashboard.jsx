import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import TicketCard from "../../components/TicketCard";
import EventCard from "../../components/EventCard";

function ParticipantDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get("/participant/dashboard");
      setDashboard(data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
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
      {/* Hero Section */}
      <div className="hero rounded-box p-8 mb-8 shadow-2xl relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(34, 197, 94, 0.3) 100%)', border: '1px solid rgba(34, 197, 94, 0.3)'}}>
        <div className="hero-content text-center relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in" style={{color: '#fff', textShadow: '0 0 30px rgba(34, 197, 94, 0.5)'}}>
              Welcome to Your Dashboard!
            </h1>
            <p className="text-lg opacity-90 mb-6" style={{color: '#e0e0e0'}}>
              Discover amazing events and manage your registrations
            </p>
            <Link to="/events" className="btn btn-primary btn-lg">
              Browse All Events
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Upcoming</div>
            <div className="stat-value text-primary">{dashboard?.upcoming?.length || 0}</div>
            <div className="stat-desc">Events registered</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </div>
            <div className="stat-title">Normal Events</div>
            <div className="stat-value text-secondary">{dashboard?.history?.normal?.length || 0}</div>
            <div className="stat-desc">Total registrations</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
            </div>
            <div className="stat-title">Merchandise</div>
            <div className="stat-value text-accent">{dashboard?.history?.merchandise?.length || 0}</div>
            <div className="stat-desc">Items purchased</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">{dashboard?.history?.completed?.length || 0}</div>
            <div className="stat-desc">Events attended</div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs tabs-boxed mb-6 bg-base-200 p-2">
        <a 
          className={`tab tab-lg ${activeTab === "upcoming" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Events
        </a>
        <a 
          className={`tab tab-lg ${activeTab === "normal" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("normal")}
        >
          Normal Events
        </a>
        <a 
          className={`tab tab-lg ${activeTab === "merchandise" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("merchandise")}
        >
          Merchandise
        </a>
        <a 
          className={`tab tab-lg ${activeTab === "completed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </a>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === "upcoming" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            {dashboard?.upcoming?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.upcoming.map(reg => (
                  <TicketCard key={reg._id} registration={reg} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
                <p className="text-lg opacity-60 mb-4">No upcoming events</p>
                <Link to="/events" className="btn btn-primary">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "normal" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Normal Event Registrations</h2>
            {dashboard?.history?.normal?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.history.normal.map(reg => (
                  <TicketCard key={reg._id} registration={reg} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
                <p className="text-lg opacity-60">No normal event registrations yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "merchandise" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Merchandise Purchases</h2>
            {dashboard?.history?.merchandise?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.history.merchandise.map(reg => (
                  <TicketCard key={reg._id} registration={reg} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
                <p className="text-lg opacity-60">No merchandise purchases yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Events</h2>
            {dashboard?.history?.completed?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.history.completed.map(reg => (
                  <TicketCard key={reg._id} registration={reg} />
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
                <p className="text-lg opacity-60">No completed events yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParticipantDashboard;
