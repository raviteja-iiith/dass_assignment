import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    eventName: "",
    eventDescription: "",
    eventType: "normal",
    eligibility: "all",
    eventTags: [],
    registrationDeadline: "",
    eventStartDate: "",
    eventEndDate: "",
    registrationLimit: 0,
    registrationFee: 0,
    venue: ""
  });
  const [tagInput, setTagInput] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !eventData.eventTags.includes(tagInput.trim())) {
      setEventData(prev => ({
        ...prev,
        eventTags: [...prev.eventTags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setEventData(prev => ({
      ...prev,
      eventTags: prev.eventTags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await API.post("/events/create", eventData);
      alert("Event created successfully as draft!");
      navigate("/organizer");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body">
          <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Event Name *</span>
              </label>
              <input
                type="text"
                name="eventName"
                placeholder="Amazing Tech Workshop"
                className="input input-bordered focus:input-primary"
                value={eventData.eventName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description *</span>
              </label>
              <textarea
                name="eventDescription"
                placeholder="Describe your event..."
                className="textarea textarea-bordered h-32 focus:textarea-primary"
                value={eventData.eventDescription}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Event Type *</span>
                </label>
                <select
                  name="eventType"
                  className="select select-bordered focus:select-primary"
                  value={eventData.eventType}
                  onChange={handleChange}
                  required
                >
                  <option value="normal">Normal Event</option>
                  <option value="merchandise">Merchandise</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Eligibility *</span>
                </label>
                <select
                  name="eligibility"
                  className="select select-bordered focus:select-primary"
                  value={eventData.eligibility}
                  onChange={handleChange}
                  required
                >
                  <option value="all">Everyone</option>
                  <option value="IIIT-only">IIIT Only</option>
                  <option value="Non-IIIT-only">Non-IIIT Only</option>
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Tags</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="input input-bordered flex-1"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <button type="button" onClick={addTag} className="btn btn-primary">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {eventData.eventTags.map(tag => (
                  <div key={tag} className="badge badge-primary gap-2">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Registration Deadline *</span>
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  className="input input-bordered focus:input-primary"
                  value={eventData.registrationDeadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Event Start *</span>
                </label>
                <input
                  type="datetime-local"
                  name="eventStartDate"
                  className="input input-bordered focus:input-primary"
                  value={eventData.eventStartDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Event End *</span>
                </label>
                <input
                  type="datetime-local"
                  name="eventEndDate"
                  className="input input-bordered focus:input-primary"
                  value={eventData.eventEndDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Registration Limit</span>
                  <span className="label-text-alt">0 = unlimited</span>
                </label>
                <input
                  type="number"
                  name="registrationLimit"
                  min="0"
                  className="input input-bordered focus:input-primary"
                  value={eventData.registrationLimit}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Registration Fee (₹)</span>
                </label>
                <input
                  type="number"
                  name="registrationFee"
                  min="0"
                  className="input input-bordered focus:input-primary"
                  value={eventData.registrationFee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Venue</span>
                </label>
                <input
                  type="text"
                  name="venue"
                  placeholder="Main Auditorium"
                  className="input input-bordered focus:input-primary"
                  value={eventData.venue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Event will be created as draft. You can publish it later from your dashboard.</span>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className={`btn btn-primary flex-1 ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/organizer")}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;
