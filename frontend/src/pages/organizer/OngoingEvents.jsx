import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";

function OngoingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOngoingEvents();
  }, []);

  const fetchOngoingEvents = async () => {
    try {
      const { data } = await API.get("/organizer/ongoing-events");
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch ongoing events:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Ongoing Events</h1>
        <p className="text-lg opacity-70">Events currently in progress</p>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event._id} className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h2 className="card-title text-lg">{event.eventName}</h2>
                  <div className="badge badge-warning">Ongoing</div>
                </div>

                <p className="text-sm opacity-70 line-clamp-3 mt-2">{event.eventDescription}</p>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="opacity-60">Type</p>
                    <div className="badge badge-sm">{event.eventType}</div>
                  </div>
                  <div>
                    <p className="opacity-60">Registrations</p>
                    <p className="font-semibold">👥 {event.totalRegistrations}</p>
                  </div>
                  <div>
                    <p className="opacity-60">Revenue</p>
                    <p className="font-semibold">💰 ₹{event.totalRevenue}</p>
                  </div>
                  <div>
                    <p className="opacity-60">Attendance</p>
                    <p className="font-semibold">✓ {event.totalAttendance}</p>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <div className="text-xs">
                  <p className="opacity-60">Event Period</p>
                  <p className="font-semibold">{formatDate(event.eventStartDate)}</p>
                  <p className="font-semibold">to {formatDate(event.eventEndDate)}</p>
                </div>

                <div className="card-actions justify-end mt-4 gap-2">
                  <Link 
                    to={`/organizer/events/${event._id}/attendance`} 
                    className="btn btn-sm btn-info"
                  >
                    📱 Attendance
                  </Link>
                  <Link 
                    to={`/organizer/events/${event._id}/analytics`} 
                    className="btn btn-sm btn-primary"
                  >
                    📊 Analytics
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg opacity-60 mb-4">No ongoing events</p>
          <p className="text-sm opacity-50">Events will appear here when they are in progress</p>
          <Link to="/organizer/create-event" className="btn btn-primary mt-4">
            Create New Event
          </Link>
        </div>
      )}
    </div>
  );
}

export default OngoingEvents;
