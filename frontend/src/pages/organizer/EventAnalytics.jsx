import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../services/api";

function EventAnalytics() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await API.get(`/organizer/events/${id}`);
      setEvent(data.event);
      setRegistrations(data.registrations);
      setFilteredRegistrations(data.registrations);
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterPayment, registrations]);

  const applyFilters = () => {
    let filtered = [...registrations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.participantId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participantId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participantId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.ticketId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(reg => reg.registrationStatus === filterStatus);
    }

    // Payment filter
    if (filterPayment !== "all") {
      filtered = filtered.filter(reg => reg.paymentStatus === filterPayment);
    }

    setFilteredRegistrations(filtered);
  };

  const exportCSV = async () => {
    try {
      const response = await API.get(`/organizer/events/${id}/export`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `participants_${event.eventName}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to export CSV");
    }
  };

  const publishEvent = async () => {
    try {
      await API.put(`/events/${id}/publish`);
      alert("Event published successfully!");
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to publish event");
    }
  };

  const updateEventStatus = async (newStatus) => {
    try {
      await API.put(`/events/${id}/status`, { status: newStatus });
      alert(`Event status changed to ${newStatus}`);
      fetchEventDetails();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.eventName}</h1>
          <p className="opacity-70">Event Analytics & Participant Management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/events/${id}`} className="btn btn-accent btn-sm">
            💬 Discussion Forum
          </Link>
          <Link to={`/organizer/events/${id}/attendance`} className="btn btn-info btn-sm">
            📱 Attendance Scanner
          </Link>
          <Link to={`/organizer/events/${id}/feedback`} className="btn btn-secondary btn-sm">
            ⭐ View Feedback
          </Link>
          {event.status === "draft" && (
            <button onClick={publishEvent} className="btn btn-success btn-sm">
              📢 Publish Event
            </button>
          )}
          {event.status === "published" && (
            <button 
              onClick={() => updateEventStatus("closed")} 
              className="btn btn-warning btn-sm"
            >
              🔒 Close Registrations
            </button>
          )}
          {event.status === "published" && (
            <button 
              onClick={() => updateEventStatus("ongoing")} 
              className="btn btn-info btn-sm"
            >
              ▶️ Mark as Ongoing
            </button>
          )}
          {event.status === "ongoing" && (
            <button 
              onClick={() => updateEventStatus("completed")} 
              className="btn btn-success btn-sm"
            >
              ✅ Mark as Completed
            </button>
          )}
          {event.status === "ongoing" && (
            <button 
              onClick={() => updateEventStatus("closed")} 
              className="btn btn-error btn-sm"
            >
              🔒 Close Event
            </button>
          )}
          {event.status === "completed" && (
            <button 
              onClick={() => updateEventStatus("closed")} 
              className="btn btn-error btn-sm"
            >
              🔒 Close Event
            </button>
          )}
          <button onClick={exportCSV} className="btn btn-primary btn-sm">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Registrations</div>
            <div className="stat-value text-primary">{event.totalRegistrations}</div>
            <div className="stat-desc">
              {event.registrationLimit > 0 && `Limit: ${event.registrationLimit}`}
            </div>
          </div>
        </div>
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Revenue</div>
            <div className="stat-value text-success">₹{event.totalRevenue}</div>
            <div className="stat-desc">
              {event.registrationFee > 0 && `Fee: ₹${event.registrationFee}`}
            </div>
          </div>
        </div>
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Attendance</div>
            <div className="stat-value text-secondary">{event.totalAttendance}</div>
            <div className="stat-desc">
              Out of {event.totalRegistrations} registered
            </div>
          </div>
        </div>
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Attendance Rate</div>
            <div className="stat-value text-accent">
              {event.totalRegistrations > 0 
                ? Math.round((event.totalAttendance / event.totalRegistrations) * 100) 
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Event Overview */}
      <div className="card bg-base-100 shadow-xl border border-base-300 mb-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Event Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-60 mb-1">Event Type</p>
              <div className="badge badge-lg">{event.eventType}</div>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Status</p>
              <div className={`badge badge-lg ${
                event.status === "published" ? "badge-success" :
                event.status === "ongoing" ? "badge-warning" :
                event.status === "completed" ? "badge-info" : "badge-neutral"
              }`}>
                {event.status}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Eligibility</p>
              <p className="font-semibold">{event.eligibility}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Registration Fee</p>
              <p className="font-semibold">₹{event.registrationFee}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Event Start</p>
              <p className="font-semibold">{new Date(event.eventStartDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Event End</p>
              <p className="font-semibold">{new Date(event.eventEndDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Registration Deadline</p>
              <p className="font-semibold">{new Date(event.registrationDeadline).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}</p>
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">Venue</p>
              <p className="font-semibold">{event.venue || "TBA"}</p>
            </div>
            {event.registrationLimit > 0 && (
              <div>
                <p className="text-sm opacity-60 mb-1">Registration Limit</p>
                <p className="font-semibold">{event.registrationLimit}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Participants ({filteredRegistrations.length})</h2>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                className="input input-bordered"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Registration Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="registered">Registered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Payment Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Reg. Date</th>
                  {event.teamSize > 0 && <th>Team</th>}
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Attended</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map(reg => (
                  <tr key={reg._id} className="hover">
                    <td className="font-mono text-sm">{reg.ticketId}</td>
                    <td>
                      {reg.participantId?.firstName} {reg.participantId?.lastName}
                    </td>
                    <td>{reg.participantId?.email}</td>
                    <td className="text-sm">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </td>
                    {event.teamSize > 0 && (
                      <td>
                        {reg.teamName ? (
                          <div className="badge badge-sm">{reg.teamName}</div>
                        ) : (
                          <span className="text-xs opacity-50">No team</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div className={`badge badge-sm ${
                        reg.registrationStatus === "registered" ? "badge-success" : "badge-error"
                      }`}>
                        {reg.registrationStatus}
                      </div>
                    </td>
                    <td>
                      <div className={`badge badge-sm ${
                        reg.paymentStatus === "completed" ? "badge-success" : "badge-warning"
                      }`}>
                        {reg.paymentStatus}
                      </div>
                    </td>
                    <td>
                      {reg.attended ? (
                        <div className="badge badge-success badge-sm">✓ Yes</div>
                      ) : (
                        <div className="badge badge-ghost badge-sm">No</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center p-8 opacity-60">
              <p>No participants found matching the filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventAnalytics;
