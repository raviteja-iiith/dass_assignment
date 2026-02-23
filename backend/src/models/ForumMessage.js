const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["like", "heart", "thumbsup", "thumbsdown", "question"],
    required: true
  }
}, { _id: false });

const forumMessageSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userRole: {
    type: String,
    enum: ["participant", "organizer"],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ForumMessage",
    default: null,
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  reactions: [reactionSchema],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  deletedAt: Date
}, { timestamps: true });

// Compound index for efficient queries
forumMessageSchema.index({ eventId: 1, createdAt: -1 });
forumMessageSchema.index({ eventId: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("ForumMessage", forumMessageSchema);
