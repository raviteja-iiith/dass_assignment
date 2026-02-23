import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
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
  
  // Custom form builder state
  const [customForm, setCustomForm] = useState([]);
  const [newField, setNewField] = useState({
    fieldName: "",
    fieldType: "text",
    required: false,
    options: ""
  });
  
  // Merchandise configuration state
  const [merchandiseDetails, setMerchandiseDetails] = useState({
    itemName: "",
    variants: [],
    purchaseLimitPerParticipant: 1
  });
  const [newVariant, setNewVariant] = useState({
    size: "",
    color: "",
    stockQuantity: 0
  });

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/organizer/events/${id}`);
      const eventData = data.event || data; // Handle both response formats
      setEvent(eventData);
      
      // Populate form with existing data
      setEventData({
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        eventType: eventData.eventType,
        eligibility: eventData.eligibility,
        eventTags: eventData.eventTags || [],
        registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : "",
        eventStartDate: eventData.eventStartDate ? new Date(eventData.eventStartDate).toISOString().slice(0, 16) : "",
        eventEndDate: eventData.eventEndDate ? new Date(eventData.eventEndDate).toISOString().slice(0, 16) : "",
        registrationLimit: eventData.registrationLimit || 0,
        registrationFee: eventData.registrationFee || 0,
        venue: eventData.venue || ""
      });
      
      if (eventData.customForm) {
        setCustomForm(eventData.customForm);
      }
      
      if (eventData.merchandiseDetails) {
        setMerchandiseDetails(eventData.merchandiseDetails);
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to fetch event");
      navigate("/organizer");
    } finally {
      setLoading(false);
    }
  };

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

  // Custom form builder functions
  const addFormField = () => {
    if (!newField.fieldName.trim()) {
      alert("Field name is required");
      return;
    }
    
    if (event.formLocked) {
      alert("Cannot add fields - form is locked after first registration");
      return;
    }
    
    // Validate dropdown has options
    if (newField.fieldType === "dropdown" && !newField.options.trim()) {
      alert("Dropdown fields require options (comma-separated)");
      return;
    }
    
    const field = {
      fieldName: newField.fieldName.trim(),
      fieldType: newField.fieldType,
      required: newField.required,
      order: customForm.length
    };
    
    // Add options if dropdown
    if (newField.fieldType === "dropdown" && newField.options.trim()) {
      field.options = newField.options.split(",").map(opt => opt.trim()).filter(opt => opt);
    }
    
    setCustomForm([...customForm, field]);
    setNewField({ fieldName: "", fieldType: "text", required: false, options: "" });
  };

  const removeFormField = (index) => {
    if (event.formLocked) {
      alert("Cannot remove fields - form is locked after first registration");
      return;
    }
    setCustomForm(customForm.filter((_, i) => i !== index));
  };

  const moveFieldUp = (index) => {
    if (index === 0) return;
    const newForm = [...customForm];
    [newForm[index - 1], newForm[index]] = [newForm[index], newForm[index - 1]];
    setCustomForm(newForm.map((field, i) => ({ ...field, order: i })));
  };

  const moveFieldDown = (index) => {
    if (index === customForm.length - 1) return;
    const newForm = [...customForm];
    [newForm[index], newForm[index + 1]] = [newForm[index + 1], newForm[index]];
    setCustomForm(newForm.map((field, i) => ({ ...field, order: i })));
  };

  // Merchandise functions
  const addVariant = () => {
    if (!newVariant.size.trim() || !newVariant.color.trim()) {
      alert("Size and color are required");
      return;
    }
    
    const variant = {
      size: newVariant.size.trim(),
      color: newVariant.color.trim(),
      stockQuantity: parseInt(newVariant.stockQuantity) || 0,
      sold: 0
    };
    
    setMerchandiseDetails(prev => ({
      ...prev,
      variants: [...prev.variants, variant]
    }));
    setNewVariant({ size: "", color: "", stockQuantity: 0 });
  };

  const removeVariant = (index) => {
    setMerchandiseDetails(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariantStock = (index, stockQuantity) => {
    setMerchandiseDetails(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => 
        i === index ? { ...v, stockQuantity: parseInt(stockQuantity) || 0 } : v
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = { ...eventData };
      
      // Add custom form for normal events
      if (eventData.eventType === "normal" && customForm.length > 0) {
        payload.customForm = customForm;
      }
      
      // Add merchandise details for merchandise events
      if (eventData.eventType === "merchandise") {
        if (!merchandiseDetails.itemName.trim()) {
          alert("Item name is required for merchandise events");
          setSaving(false);
          return;
        }
        if (merchandiseDetails.variants.length === 0) {
          alert("At least one variant is required for merchandise events");
          setSaving(false);
          return;
        }
        payload.merchandiseDetails = merchandiseDetails;
      }
      
      await API.put(`/events/${id}`, payload);
      alert("Event updated successfully!");
      navigate("/organizer");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-8">
        <div className="alert alert-error">Event not found</div>
      </div>
    );
  }

  const canFullyEdit = event.status === "draft";
  const canLimitedEdit = event.status === "published";
  const cannotEdit = event.status === "ongoing" || event.status === "completed" || event.status === "closed";

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body">
          <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
          <div className="badge badge-lg mb-4">Status: {event.status}</div>
          
          {cannotEdit && (
            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Ongoing/completed events cannot be edited</span>
            </div>
          )}
          
          {canLimitedEdit && (
            <div className="alert alert-info mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Published events have limited editing - only description, deadline, and limit can be changed</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Event Name *</span>
              </label>
              <input
                type="text"
                name="eventName"
                className="input input-bordered focus:input-primary"
                value={eventData.eventName}
                onChange={handleChange}
                disabled={!canFullyEdit}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description *</span>
              </label>
              <textarea
                name="eventDescription"
                className="textarea textarea-bordered h-32 focus:textarea-primary"
                value={eventData.eventDescription}
                onChange={handleChange}
                disabled={cannotEdit}
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
                  disabled={!canFullyEdit}
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
                  disabled={!canFullyEdit}
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
                  disabled={!canFullyEdit}
                />
                <button type="button" onClick={addTag} className="btn btn-primary" disabled={!canFullyEdit}>
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {eventData.eventTags.map(tag => (
                  <div key={tag} className="badge badge-primary gap-2">
                    {tag}
                    {canFullyEdit && <button type="button" onClick={() => removeTag(tag)}>✕</button>}
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
                  disabled={cannotEdit}
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
                  disabled={!canFullyEdit}
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
                  disabled={!canFullyEdit}
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
                  disabled={cannotEdit}
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
                  disabled={!canFullyEdit}
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
                  disabled={!canFullyEdit}
                />
              </div>
            </div>

            {/* Custom Form Builder - Only for Normal Events */}
            {eventData.eventType === "normal" && (
              <div className="card bg-base-200 border border-primary">
                <div className="card-body">
                  <h2 className="card-title text-primary">📝 Custom Registration Form Builder</h2>
                  {event.formLocked && (
                    <div className="alert alert-warning">
                      <span>Form is locked - registrations have been received. You can only reorder fields.</span>
                    </div>
                  )}
                  
                  {!event.formLocked && canFullyEdit && (
                    <div className="space-y-3 p-4 bg-base-100 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Field Name</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Dietary Preference, Skill Level"
                            className="input input-bordered input-sm"
                            value={newField.fieldName}
                            onChange={(e) => setNewField({...newField, fieldName: e.target.value})}
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Field Type</span>
                          </label>
                          <select
                            className="select select-bordered select-sm"
                            value={newField.fieldType}
                            onChange={(e) => setNewField({...newField, fieldType: e.target.value})}
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="textarea">Textarea</option>
                            <option value="dropdown">Dropdown</option>
                          </select>
                        </div>
                      </div>
                      
                      {newField.fieldType === "dropdown" && (
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Options (comma-separated) *</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Vegetarian, Non-Veg, Vegan"
                            className="input input-bordered input-sm"
                            value={newField.options}
                            onChange={(e) => setNewField({...newField, options: e.target.value})}
                          />
                          <label className="label">
                            <span className="label-text-alt text-warning">Required for dropdown fields</span>
                          </label>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <label className="label cursor-pointer gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={newField.required}
                            onChange={(e) => setNewField({...newField, required: e.target.checked})}
                          />
                          <span className="label-text">Required field</span>
                        </label>
                        
                        <button
                          type="button"
                          onClick={addFormField}
                          className="btn btn-primary btn-sm"
                        >
                          + Add Field
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {customForm.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold">Form Preview ({customForm.length} fields):</h3>
                      {customForm.map((field, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border border-primary">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">
                              {index + 1}. {field.fieldName}
                              {field.required && <span className="text-error ml-1">*</span>}
                            </div>
                            <div className="text-sm opacity-70">
                              <span className="badge badge-sm badge-primary mr-2">{field.fieldType}</span>
                              {field.options && field.options.length > 0 && (
                                <span>Options: {field.options.join(", ")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveFieldUp(index)}
                              className="btn btn-xs btn-ghost"
                              disabled={index === 0 || !canFullyEdit}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFieldDown(index)}
                              className="btn btn-xs btn-ghost"
                              disabled={index === customForm.length - 1 || !canFullyEdit}
                            >
                              ↓
                            </button>
                            {!event.formLocked && canFullyEdit && (
                              <button
                                type="button"
                                onClick={() => removeFormField(index)}
                                className="btn btn-xs btn-error"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Merchandise Configuration - Only for Merchandise Events */}
            {eventData.eventType === "merchandise" && (
              <div className="card bg-base-200 border border-secondary">
                <div className="card-body">
                  <h2 className="card-title text-secondary">🛍️ Merchandise Configuration</h2>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Item Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Fest T-Shirt 2024"
                      className="input input-bordered"
                      value={merchandiseDetails.itemName}
                      onChange={(e) => setMerchandiseDetails({...merchandiseDetails, itemName: e.target.value})}
                      disabled={!canFullyEdit}
                      required={eventData.eventType === "merchandise"}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Purchase Limit Per Participant</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered"
                      value={merchandiseDetails.purchaseLimitPerParticipant}
                      onChange={(e) => setMerchandiseDetails({...merchandiseDetails, purchaseLimitPerParticipant: parseInt(e.target.value) || 1})}
                      disabled={!canFullyEdit}
                    />
                  </div>
                  
                  {canFullyEdit && (
                    <div className="space-y-3 p-4 bg-base-100 rounded-lg mt-4">
                      <h3 className="font-semibold">Add Variant</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Size</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., M"
                            className="input input-bordered input-sm"
                            value={newVariant.size}
                            onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Color</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Black"
                            className="input input-bordered input-sm"
                            value={newVariant.color}
                            onChange={(e) => setNewVariant({...newVariant, color: e.target.value})}
                          />
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Stock Quantity</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input input-bordered input-sm"
                            value={newVariant.stockQuantity}
                            onChange={(e) => setNewVariant({...newVariant, stockQuantity: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={addVariant}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Variant
                      </button>
                    </div>
                  )}
                  
                  {merchandiseDetails.variants.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold">Variants ({merchandiseDetails.variants.length}):</h3>
                      {merchandiseDetails.variants.map((variant, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                          <div className="flex-1">
                            <span className="font-semibold">Size: {variant.size}</span>
                            <span className="mx-2">|</span>
                            <span className="font-semibold">Color: {variant.color}</span>
                            <span className="mx-2">|</span>
                            <span>Stock: </span>
                            <input
                              type="number"
                              min="0"
                              className="input input-bordered input-xs w-20 mx-1"
                              value={variant.stockQuantity}
                              onChange={(e) => updateVariantStock(index, e.target.value)}
                              disabled={cannotEdit}
                            />
                            <span className="text-sm opacity-70">| Sold: {variant.sold || 0}</span>
                          </div>
                          {canFullyEdit && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="btn btn-xs btn-error"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!cannotEdit && (
              <div className="flex gap-4">
                <button
                  type="submit"
                  className={`btn btn-primary flex-1 ${saving ? "loading" : ""}`}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/organizer")}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;
