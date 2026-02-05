const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/users");
const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");

// Get organizer dashboard with event carousel
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;

      // Get all events by organizer
      const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

      // Get analytics for completed events
      const completedEvents = events.filter(e => e.status === "completed");
      const analytics = {
        totalRegistrations: completedEvents.reduce((sum, e) => sum + e.totalRegistrations, 0),
        totalRevenue: completedEvents.reduce((sum, e) => sum + e.totalRevenue, 0),
        totalAttendance: completedEvents.reduce((sum, e) => sum + e.totalAttendance, 0),
        totalEvents: completedEvents.length
      };

      res.json({
        events,
        analytics
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get specific event details with participant list
router.get(
  "/events/:eventId",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id || req.user.id
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      // Get all registrations for this event
      const registrations = await Registration.find({ eventId: event._id })
        .populate("participantId", "firstName lastName email contactNumber")
        .sort({ createdAt: -1 });

      // Calculate analytics
      const analytics = {
        totalRegistrations: event.totalRegistrations,
        totalRevenue: event.totalRevenue,
        totalAttendance: event.totalAttendance,
        attendanceRate: event.totalRegistrations > 0 ? 
          ((event.totalAttendance / event.totalRegistrations) * 100).toFixed(2) : 0
      };

      res.json({
        event,
        registrations,
        analytics
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Export participants as CSV
router.get(
  "/events/:eventId/export",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id || req.user.id
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      const registrations = await Registration.find({ eventId: event._id })
        .populate("participantId", "firstName lastName email contactNumber collegeName");

      // Create CSV
      let csv = "Ticket ID,First Name,Last Name,Email,Contact,College,Registration Date,Payment Status,Amount,Attended\n";
      
      registrations.forEach(reg => {
        if (reg.participantId) {
          csv += `${reg.ticketId},`;
          csv += `${reg.participantId.firstName},`;
          csv += `${reg.participantId.lastName || ""},`;
          csv += `${reg.participantId.email},`;
          csv += `${reg.participantId.contactNumber || ""},`;
          csv += `${reg.participantId.collegeName || ""},`;
          csv += `${new Date(reg.createdAt).toLocaleDateString()},`;
          csv += `${reg.paymentStatus},`;
          csv += `${reg.paymentAmount || 0},`;
          csv += `${reg.attended ? "Yes" : "No"}\n`;
        }
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=participants_${event.eventName}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Mark attendance for a participant
router.put(
  "/registrations/:registrationId/attendance",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const registration = await Registration.findById(req.params.registrationId).populate("eventId");

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      // Verify organizer owns this event
      if (registration.eventId.organizerId.toString() !== (req.user._id || req.user.id).toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      registration.attended = true;
      registration.attendanceMarkedAt = new Date();
      await registration.save();

      // Update event attendance count
      const event = await Event.findById(registration.eventId._id);
      event.totalAttendance += 1;
      await event.save();

      res.json({ message: "Attendance marked successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Verify ticket by QR code scan
router.post(
  "/verify-ticket",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { ticketId } = req.body;

      const registration = await Registration.findOne({ ticketId })
        .populate("eventId")
        .populate("participantId", "firstName lastName email");

      if (!registration) {
        return res.status(404).json({ error: "Invalid ticket" });
      }

      // Verify organizer owns this event
      if (registration.eventId.organizerId.toString() !== (req.user._id || req.user.id).toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (registration.registrationStatus !== "registered") {
        return res.status(400).json({ error: "Registration is cancelled or rejected" });
      }

      res.json({
        valid: true,
        participant: registration.participantId,
        event: registration.eventId.eventName,
        attended: registration.attended,
        registration
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update organizer profile
router.get(
  "/profile",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const organizer = await User.findById(req.user._id || req.user.id).select("-password");
      res.json(organizer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put(
  "/profile",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { organizerName, category, description, contactEmail, contactNumber, discordWebhook } = req.body;
      
      const organizer = await User.findById(req.user._id || req.user.id);

      if (organizerName) organizer.organizerName = organizerName;
      if (category) organizer.category = category;
      if (description !== undefined) organizer.description = description;
      if (contactEmail) organizer.contactEmail = contactEmail;
      if (contactNumber) organizer.contactNumber = contactNumber;
      if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

      await organizer.save();

      res.json({ message: "Profile updated successfully", organizer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get ongoing events
router.get(
  "/ongoing-events",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const now = new Date();
      const events = await Event.find({
        organizerId: req.user._id || req.user.id,
        status: "ongoing"
      }).sort({ eventStartDate: 1 });

      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Close event registrations
router.put(
  "/events/:eventId/close-registration",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id || req.user.id
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      event.status = "closed";
      await event.save();

      res.json({ message: "Event registrations closed" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
