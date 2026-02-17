import { Link } from "react-router-dom";

function EventCard({ event }) {
  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <Link to={`/events/${event._id}`}>
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300 h-full">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <h2 className="card-title text-lg line-clamp-2">{event.eventName}</h2>
            <div className={`badge ${event.eventType === "merchandise" ? "badge-secondary" : "badge-primary"}`}>
              {event.eventType}
            </div>
          </div>
          
          <p className="text-sm opacity-70 line-clamp-2">{event.eventDescription}</p>
          
          <div className="flex gap-2 flex-wrap mt-2">
            {event.eventTags?.slice(0, 3).map((tag, idx) => (
              <div key={idx} className="badge badge-outline badge-sm">{tag}</div>
            ))}
          </div>
          
          <div className="divider my-2"></div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(event.eventStartDate)}</span>
            </div>
            
            {event.registrationFee > 0 && (
              <div className="badge badge-accent">₹{event.registrationFee}</div>
            )}
          </div>
          
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="opacity-60">📍 {event.venue || "TBA"}</span>
            <span className="opacity-60">👥 {event.totalRegistrations} registered</span>
          </div>
          
          {event.organizerId && (
            <div className="text-xs opacity-60 mt-2">
              By {event.organizerId.organizerName || event.organizerId.email}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
