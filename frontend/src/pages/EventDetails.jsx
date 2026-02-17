import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/events/${id}`);
      setEvent(data);
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data } = await API.post(`/events/${id}/register`, { formResponses });
      alert(`Registration successful! Ticket ID: ${data.ticketId}`);
      navigate("/participant");
    } catch (error) {
      alert(error.response?.data?.error || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handlePurchase = async () => {
    if (selectedVariant === null) {
      alert("Please select a variant");
      return;
    }
    
    setRegistering(true);
    try {
      const { data } = await API.post(`/events/${id}/purchase`, {
        variantIndex: selectedVariant,
        quantity
      });
      alert(`Purchase successful! Ticket ID: ${data.ticketId}`);
      navigate("/participant");
    } catch (error) {
      alert(error.response?.data?.error || "Purchase failed");
    } finally {
      setRegistering(false);
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

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isLimitReached = event.registrationLimit > 0 && event.totalRegistrations >= event.registrationLimit;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      {/* Hero Section */}
      <div className="card shadow-2xl mb-8" style={{background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.4) 100%)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#fff'}}>
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-2 mb-2">
                <div className={`badge ${event.eventType === "merchandise" ? "badge-accent" : "badge-neutral"}`}>
                  {event.eventType}
                </div>
                <div className={`badge ${event.status === "published" ? "badge-success" : "badge-warning"}`}>
                  {event.status}
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-2">{event.eventName}</h1>
              <p className="text-lg opacity-90">
                by {event.organizerId?.organizerName || "Unknown Organizer"}
              </p>
            </div>
            {event.registrationFee > 0 && (
              <div className="text-right">
                <p className="text-sm opacity-90">Registration Fee</p>
                <p className="text-3xl font-bold">₹{event.registrationFee}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title">About This Event</h2>
              <p className="whitespace-pre-line">{event.eventDescription}</p>
            </div>
          </div>

          {/* Tags */}
          {event.eventTags && event.eventTags.length > 0 && (
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {event.eventTags.map((tag, idx) => (
                    <div key={idx} className="badge badge-primary badge-lg">{tag}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Form or Merchandise Variants */}
          {event.eventType === "normal" && event.customForm && event.customForm.length > 0 && (
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title">Registration Form</h3>
                <div className="space-y-4">
                  {event.customForm.map((field, idx) => (
                    <div key={idx} className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          {field.fieldName} {field.required && <span className="text-error">*</span>}
                        </span>
                      </label>
                      {field.fieldType === "dropdown" ? (
                        <select
                          className="select select-bordered"
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.fieldType === "textarea" ? (
                        <textarea
                          className="textarea textarea-bordered"
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.fieldType}
                          className="input input-bordered"
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {event.eventType === "merchandise" && event.merchandiseDetails && (
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title">Available Variants</h3>
                <div className="space-y-3">
                  {event.merchandiseDetails.variants?.map((variant, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedVariant(idx)}
                      className={`card bg-base-200 cursor-pointer transition-all hover:shadow-lg ${
                        selectedVariant === idx ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Size: {variant.size} | Color: {variant.color}</p>
                            <p className="text-sm opacity-70">Stock: {variant.stockQuantity} | Sold: {variant.sold}</p>
                          </div>
                          {selectedVariant === idx && (
                            <div className="badge badge-primary">Selected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text font-semibold">Quantity</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={event.merchandiseDetails.purchaseLimitPerParticipant}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="input input-bordered"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Max {event.merchandiseDetails.purchaseLimitPerParticipant} per person
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Info */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="opacity-60">Event Start</p>
                  <p className="font-semibold">{formatDate(event.eventStartDate)}</p>
                </div>
                <div className="divider my-1"></div>
                <div>
                  <p className="opacity-60">Event End</p>
                  <p className="font-semibold">{formatDate(event.eventEndDate)}</p>
                </div>
                <div className="divider my-1"></div>
                <div>
                  <p className="opacity-60">Registration Deadline</p>
                  <p className="font-semibold">{formatDate(event.registrationDeadline)}</p>
                </div>
                <div className="divider my-1"></div>
                <div>
                  <p className="opacity-60">Venue</p>
                  <p className="font-semibold">📍 {event.venue || "TBA"}</p>
                </div>
                <div className="divider my-1"></div>
                <div>
                  <p className="opacity-60">Eligibility</p>
                  <p className="font-semibold">{event.eligibility}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-60">Registrations</span>
                  <span className="font-semibold">{event.totalRegistrations}</span>
                </div>
                {event.registrationLimit > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-60">Limit</span>
                    <span className="font-semibold">{event.registrationLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="opacity-60">Views</span>
                  <span className="font-semibold">{event.views}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Button */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              {isDeadlinePassed ? (
                <div className="alert alert-error">
                  <span>Registration deadline has passed</span>
                </div>
              ) : isLimitReached ? (
                <div className="alert alert-warning">
                  <span>Registration limit reached</span>
                </div>
              ) : (
                <button
                  onClick={event.eventType === "merchandise" ? handlePurchase : handleRegister}
                  className={`btn btn-primary btn-lg w-full ${registering ? "loading" : ""}`}
                  disabled={registering}
                >
                  {registering
                    ? "Processing..."
                    : event.eventType === "merchandise"
                    ? "Purchase Now"
                    : "Register Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;