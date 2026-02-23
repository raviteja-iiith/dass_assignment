const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Registration type
  registrationType: {
    type: String,
    enum: ["normal", "merchandise"],
    required: true
  },
  
  // Custom form responses (for normal events)
  formResponses: mongoose.Schema.Types.Mixed,
  
  // Merchandise purchase details
  merchandisePurchase: {
    variant: {
      size: String,
      color: String
    },
    quantity: Number,
    totalPrice: Number
  },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  paymentAmount: Number,
  paymentDate: Date,
  
  // Payment proof (for merchandise)
  paymentProof: String, // File path/URL to uploaded payment proof
  paymentApprovalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  paymentRejectionReason: String,
  
  // Status tracking
  registrationStatus: {
    type: String,
    enum: ["registered", "cancelled", "rejected", "waitlisted"],
    default: "registered"
  },
  
  // Attendance tracking
  attended: {
    type: Boolean,
    default: false
  },
  attendanceMarkedAt: Date,
  
  // Attendance audit log
  attendanceLog: [{
    timestamp: { type: Date, default: Date.now },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["scan", "manual"], default: "scan" },
    notes: String
  }],
  
  // Manual override
  manualOverride: {
    type: Boolean,
    default: false
  },
  overrideReason: String,
  
  // QR Code
  qrCode: String, // Base64 or URL
  
  // Email sent confirmation
  emailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for faster queries
registrationSchema.index({ participantId: 1, eventId: 1 });
registrationSchema.index({ eventId: 1, registrationStatus: 1 });

module.exports = mongoose.model("Registration", registrationSchema);
