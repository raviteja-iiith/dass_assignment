const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ eventId: 1, createdAt: -1 });
feedbackSchema.index({ eventId: 1, rating: 1 });

// Ensure one feedback per participant per event
feedbackSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
