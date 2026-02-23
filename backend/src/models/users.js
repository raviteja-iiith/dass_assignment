const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function() {
        return this.role === "participant";
      }
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "organizer", "participant"],
      default: "participant",
    },
    // Participant specific fields
    participantType: {
      type: String,
      enum: ["IIIT", "Non-IIIT"],
    },
    collegeName: String,
    contactNumber: String,
    areasOfInterest: [String],
    followedOrganizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // Organizer specific fields
    organizerName: String,
    category: String,
    description: String,
    contactEmail: String,
    contactNumber: String,
    discordWebhook: String,
    isApproved: {
      type: Boolean,
      default: false
    },
    
    // Common
    passwordResetRequested: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
