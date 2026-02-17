import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";

function EventAnalytics() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await API.get(`/organizer/events/${id}`);
      setEvent(data.event);
      setRegistrations(data.registrations);
    } catch (error) {
      console.error("Failed to fetch event details:", error);
    } finally {
      setLoading(false);
    }
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
        <div className="flex gap-2">
          {event.status === "draft" && (
            <button onClick={publishEvent} className="btn btn-success">
              Publish Event
            </button>
          )}
          <button onClick={exportCSV} className="btn btn-primary">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Registrations</div>
            <div className="stat-value text-primary">{event.totalRegistrations}</div>
          </div>
        </div>
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Revenue</div>
            <div className="stat-value text-success">₹{event.totalRevenue}</div>
          </div>
        </div>
        <div className="stats shadow border border-base-300">
          <div className="stat">
            <div className="stat-title">Attendance</div>
            <div className="stat-value text-secondary">{event.totalAttendance}</div>
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

      {/* Participants Table */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title mb-4">Participants ({registrations.length})</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Attended</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg._id} className="hover">
                    <td className="font-mono text-sm">{reg.ticketId}</td>
                    <td>
                      {reg.participantId?.firstName} {reg.participantId?.lastName}
                    </td>
                    <td>{reg.participantId?.email}</td>
                    <td>
                      <div className={`badge ${
                        reg.registrationStatus === "registered" ? "badge-success" : "badge-error"
                      }`}>
                        {reg.registrationStatus}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${
                        reg.paymentStatus === "completed" ? "badge-success" : "badge-warning"
                      }`}>
                        {reg.paymentStatus}
                      </div>
                    </td>
                    <td>
                      {reg.attended ? (
                        <div className="badge badge-success">✓ Yes</div>
                      ) : (
                        <div className="badge badge-ghost">No</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventAnalytics;
