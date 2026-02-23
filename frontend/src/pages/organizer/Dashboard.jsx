import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";

function OrganizerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketId, setTicketId] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get("/organizer/dashboard");
      setDashboard(data);
      if (data.events.length > 0) {
        setSelectedEvent(data.events[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyTicket = async () => {
    if (!ticketId.trim()) return;
    
    try {
      const { data } = await API.post("/organizer/verify-ticket", { ticketId });
      setVerificationResult(data);
    } catch (error) {
      setVerificationResult({ valid: false, error: error.response?.data?.error });
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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Organizer Dashboard</h1>
          <p className="text-lg opacity-70">Manage your events and participants</p>
        </div>
        <div className="flex gap-2">
          <Link to="/organizer/password-reset" className="btn btn-ghost">
            🔑 Password Reset
          </Link>
          <Link to="/organizer/merchandise-orders" className="btn btn-secondary">
            📦 Merchandise Orders
          </Link>
          <Link to="/organizer/create-event" className="btn btn-primary btn-lg">
            + Create New Event
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="stat-title">Total Events</div>
            <div className="stat-value text-primary">{dashboard?.analytics.totalEvents || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Registrations</div>
            <div className="stat-value text-secondary">{dashboard?.analytics.totalRegistrations || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Attendance</div>
            <div className="stat-value text-success">{dashboard?.analytics.totalAttendance || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-xl transition-all">
          <div className="stat">
            <div className="stat-figure text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-accent">₹{dashboard?.analytics.totalRevenue || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events Carousel */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title mb-4">Your Events</h2>
            {dashboard?.events && dashboard.events.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboard.events.map(event => (
                  <div 
                    key={event._id}
                    className="card bg-base-200 shadow-lg"
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{event.eventName}</h3>
                          <p className="text-sm opacity-70">{new Date(event.eventStartDate).toLocaleDateString()}</p>
                        </div>
                        <div className={`badge ${event.status === "published" ? "badge-success" : event.status === "ongoing" ? "badge-warning" : "badge-neutral"}`}>
                          {event.status}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm mb-3">
                        <span>👥 {event.totalRegistrations}</span>
                        <span>💰 ₹{event.totalRevenue}</span>
                        <span>✓ {event.totalAttendance}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Link 
                          to={`/events/${event._id}`}
                          className="btn btn-sm btn-accent"
                        >
                          💬 Forum
                        </Link>
                        <Link 
                          to={`/organizer/events/${event._id}/analytics`}
                          className="btn btn-sm btn-primary"
                        >
                          📊 Analytics
                        </Link>
                        <Link 
                          to={`/organizer/events/${event._id}/attendance`}
                          className="btn btn-sm btn-info"
                        >
                          📱 Scanner
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="opacity-60 mb-4">No events yet</p>
                <Link to="/organizer/create-event" className="btn btn-primary">
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* QR Verification */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title mb-4">QR Code Verification</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Scan or Enter Ticket ID</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter ticket ID..."
                  className="input input-bordered flex-1"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                />
                <button onClick={verifyTicket} className="btn btn-primary">
                  Verify
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className={`alert ${verificationResult.valid ? "alert-success" : "alert-error"} mt-4`}>
                {verificationResult.valid ? (
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-bold">Valid Ticket</h3>
                      <div className="text-sm">
                        <p>Participant: {verificationResult.participant?.firstName} {verificationResult.participant?.lastName}</p>
                        <p>Event: {verificationResult.event}</p>
                        <p>Attended: {verificationResult.attended ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{verificationResult.error || "Invalid ticket"}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
