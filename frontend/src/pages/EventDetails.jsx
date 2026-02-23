import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import ForumDiscussion from "../components/ForumDiscussion";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchEvent();
    checkRegistration();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/events/${id}`);
      setEvent(data);
      const userId = user?._id || user?.id;
      const organizerId = data.organizerId?._id || data.organizerId;
      setIsOrganizer(user?.role === "organizer" && userId === organizerId);
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (user?.role === "participant") {
      try {
        const { data } = await API.get("/participant/dashboard");
        const allRegistrations = [...data.upcoming, ...data.history.normal, ...data.history.merchandise];
        const registered = allRegistrations.some(
          r => r.eventId?._id === id && r.registrationStatus === "registered"
        );
        setIsRegistered(registered);
      } catch (error) {
        console.error("Failed to check registration:", error);
      }
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data } = await API.post(`/events/${id}/register`, { formResponses });
      alert(`✅ Registration successful!\n\nTicket ID: ${data.ticketId}\n\nA confirmation email with your ticket and QR code has been sent to your registered email.`);
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
    
    const variant = event.merchandiseDetails.variants[selectedVariant];
    if (variant.stockQuantity === 0) {
      alert("Selected variant is out of stock");
      return;
    }
    
    if (variant.stockQuantity < quantity) {
      alert(`Insufficient stock. Only ${variant.stockQuantity} items available.`);
      return;
    }
    
    if (!paymentProof) {
      alert("Please upload payment proof");
      return;
    }
    
    setRegistering(true);
    try {
      const formData = new FormData();
      formData.append("variantIndex", selectedVariant);
      formData.append("quantity", quantity);
      formData.append("paymentProof", paymentProof);
      
      const { data } = await API.post(`/events/${id}/purchase`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      alert(`✅ Purchase successful!\n\nTicket ID: ${data.ticketId}\n\nA confirmation email with your ticket and QR code has been sent to your registered email.`);
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
  
  // Stock validation for merchandise
  const isStockExhausted = event.eventType === "merchandise" && event.merchandiseDetails?.variants?.every(v => v.stockQuantity === 0);
  const selectedVariantOutOfStock = event.eventType === "merchandise" && selectedVariant !== null && 
    event.merchandiseDetails?.variants[selectedVariant]?.stockQuantity < quantity;
  
  // Check if user can register/purchase
  const canRegister = user?.role === "participant" && !isRegistered && !isOrganizer;

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

      {/* Tabs */}
      {(isRegistered || isOrganizer) && (
        <div className="tabs tabs-boxed mb-6">
          <a
            className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Event Details
          </a>
          <a
            className={`tab ${activeTab === "forum" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("forum")}
          >
            💬 Discussion Forum
          </a>
        </div>
      )}

      {/* Forum Tab */}
      {activeTab === "forum" && (isRegistered || isOrganizer) && (
        <ForumDiscussion eventId={id} isOrganizer={isOrganizer} />
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
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
                <p className="text-sm opacity-70 mb-4">Please fill out the following information</p>
                <div className="space-y-4">
                  {event.customForm.map((field, idx) => (
                    <div key={idx} className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">
                          {field.fieldName} {field.required && <span className="text-error">*</span>}
                        </span>
                        <span className="label-text-alt badge badge-sm">{field.fieldType}</span>
                      </label>
                      {field.fieldType === "dropdown" ? (
                        <select
                          className="select select-bordered"
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.fieldType === "textarea" ? (
                        <textarea
                          className="textarea textarea-bordered h-24"
                          placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        />
                      ) : field.fieldType === "number" ? (
                        <input
                          type="number"
                          className="input input-bordered"
                          placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        />
                      ) : field.fieldType === "email" ? (
                        <input
                          type="email"
                          className="input input-bordered"
                          placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                          onChange={(e) => setFormResponses({...formResponses, [field.fieldName]: e.target.value})}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type="text"
                          className="input input-bordered"
                          placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
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
                      onClick={() => variant.stockQuantity > 0 && setSelectedVariant(idx)}
                      className={`card bg-base-200 transition-all ${
                        variant.stockQuantity > 0 ? "cursor-pointer hover:shadow-lg" : "opacity-50 cursor-not-allowed"
                      } ${selectedVariant === idx ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold">Size: {variant.size} | Color: {variant.color}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <p className="text-sm opacity-70">
                                Stock: {variant.stockQuantity} | Sold: {variant.sold}
                              </p>
                              {variant.stockQuantity === 0 ? (
                                <div className="badge badge-error badge-sm">Out of Stock</div>
                              ) : variant.stockQuantity <= 5 ? (
                                <div className="badge badge-warning badge-sm">Low Stock</div>
                              ) : null}
                            </div>
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
                    max={selectedVariant !== null 
                      ? Math.min(
                          event.merchandiseDetails.purchaseLimitPerParticipant,
                          event.merchandiseDetails.variants[selectedVariant]?.stockQuantity || 0
                        )
                      : event.merchandiseDetails.purchaseLimitPerParticipant
                    }
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="input input-bordered"
                    disabled={selectedVariant === null}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      {selectedVariant !== null 
                        ? `Max ${Math.min(
                            event.merchandiseDetails.purchaseLimitPerParticipant,
                            event.merchandiseDetails.variants[selectedVariant]?.stockQuantity || 0
                          )} (Purchase limit: ${event.merchandiseDetails.purchaseLimitPerParticipant}, Available stock: ${event.merchandiseDetails.variants[selectedVariant]?.stockQuantity || 0})`
                        : `Max ${event.merchandiseDetails.purchaseLimitPerParticipant} per person`
                      }
                    </span>
                  </label>
                </div>
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text font-semibold">Payment Proof <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    className="file-input file-input-bordered w-full"
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Upload payment screenshot/receipt (Required for order approval)
                    </span>
                  </label>
                  {paymentProof && (
                    <div className="mt-2 text-sm text-success">
                      ✓ File selected: {paymentProof.name}
                    </div>
                  )}
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
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="opacity-60">Registrations</span>
                    <span className="font-semibold">
                      {event.totalRegistrations}
                      {event.registrationLimit > 0 && ` / ${event.registrationLimit}`}
                    </span>
                  </div>
                  {event.registrationLimit > 0 && (
                    <div>
                      <progress 
                        className={`progress ${
                          (event.totalRegistrations / event.registrationLimit) >= 1 ? "progress-error" :
                          (event.totalRegistrations / event.registrationLimit) >= 0.8 ? "progress-warning" :
                          "progress-success"
                        } w-full`}
                        value={event.totalRegistrations} 
                        max={event.registrationLimit}
                      />
                      <p className="text-xs opacity-60 mt-1 text-center">
                        {Math.round((event.totalRegistrations / event.registrationLimit) * 100)}% filled
                        {event.totalRegistrations >= event.registrationLimit && " - FULL"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between">
                  <span className="opacity-60">Views</span>
                  <span className="font-semibold">👁️ {event.views}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Button */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              {!canRegister ? (
                isRegistered ? (
                  <div className="alert alert-success">
                    <span>✓ You are already registered for this event</span>
                  </div>
                ) : user?.role !== "participant" ? (
                  <div className="alert alert-info">
                    <span>Only participants can register for events</span>
                  </div>
                ) : null
              ) : isDeadlinePassed ? (
                <div className="alert alert-error">
                  <span>❌ Registration deadline has passed</span>
                </div>
              ) : isLimitReached ? (
                <div className="alert alert-warning">
                  <span>⚠️ Registration limit reached</span>
                </div>
              ) : isStockExhausted ? (
                <div className="alert alert-error">
                  <span>❌ All variants are out of stock</span>
                </div>
              ) : selectedVariantOutOfStock ? (
                <div className="alert alert-error">
                  <span>❌ Selected variant has insufficient stock (Available: {event.merchandiseDetails?.variants[selectedVariant]?.stockQuantity})</span>
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
                    ? "💳 Purchase Now"
                    : "📝 Register Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default EventDetails;