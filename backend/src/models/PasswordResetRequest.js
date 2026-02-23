const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  adminComment: {
    type: String,
    maxlength: 500
  },
  newPassword: {
    type: String // Stores plaintext temporarily for admin to share, then cleared
  },
  newPasswordHashed: {
    type: String // Hashed version stored permanently
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  processedAt: Date
}, { timestamps: true });

// Index for efficient queries
passwordResetRequestSchema.index({ organizerId: 1, createdAt: -1 });
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
