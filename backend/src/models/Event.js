const mongoose = require("mongoose");

const customFormFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { 
    type: String, 
    enum: ["text", "email", "number", "dropdown", "textarea"],
    required: true 
  },
  required: { type: Boolean, default: false },
  options: [String], // For dropdown
  order: { type: Number, default: 0 }
});

const merchandiseVariantSchema = new mongoose.Schema({
  size: String,
  color: String,
  stockQuantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 }
});

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  eventDescription: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ["normal", "merchandise"],
    required: true
  },
  eligibility: {
    type: String,
    enum: ["IIIT-only", "Non-IIIT-only", "all"],
    default: "all"
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  eventTags: [String],
  
  // Status tracking
  status: {
    type: String,
    enum: ["draft", "published", "ongoing", "completed", "closed"],
    default: "draft"
  },
  
  // Custom registration form (for normal events)
  customForm: [customFormFieldSchema],
  formLocked: {
    type: Boolean,
    default: false
  },
  
  // Merchandise specific
  merchandiseDetails: {
    itemName: String,
    variants: [merchandiseVariantSchema],
    purchaseLimitPerParticipant: { type: Number, default: 1 }
  },
  
  // Statistics
  totalRegistrations: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalAttendance: {
    type: Number,
    default: 0
  },
  
  // Venue (optional)
  venue: String,
  
  // View tracking for trending
  views: {
    type: Number,
    default: 0
  },
  lastViewReset: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for search and filtering
eventSchema.index({ eventName: "text", eventDescription: "text", eventTags: "text" });
eventSchema.index({ eventType: 1, status: 1, eventStartDate: 1 });

module.exports = mongoose.model("Event", eventSchema);
