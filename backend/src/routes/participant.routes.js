const express = require("express");
const router = express.Router();
const User = require("../models/users");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");

// Get participant dashboard
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const participantId = req.user._id || req.user.id;
      
      // Get upcoming events
      const upcomingRegistrations = await Registration.find({
        participantId,
        registrationStatus: "registered"
      })
        .populate({
          path: "eventId",
          match: { eventStartDate: { $gte: new Date() } },
          populate: { path: "organizerId", select: "organizerName" }
        })
        .sort({ createdAt: -1 });

      const upcoming = upcomingRegistrations.filter(r => r.eventId !== null);

      // Get participation history
      const allRegistrations = await Registration.find({
        participantId
      })
        .populate({
          path: "eventId",
          populate: { path: "organizerId", select: "organizerName" }
        })
        .sort({ createdAt: -1 });

      const history = {
        normal: allRegistrations.filter(r => r.eventId && r.registrationType === "normal"),
        merchandise: allRegistrations.filter(r => r.eventId && r.registrationType === "merchandise"),
        completed: allRegistrations.filter(r => r.eventId && r.eventId.status === "completed"),
        cancelled: allRegistrations.filter(r => r.registrationStatus === "cancelled" || r.registrationStatus === "rejected")
      };

      res.json({
        upcoming,
        history
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get participant profile
router.get(
  "/profile",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const participant = await User.findById(req.user._id || req.user.id)
        .select("-password")
        .populate("followedOrganizers", "organizerName category");
      
      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update participant profile
router.put(
  "/profile",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const { firstName, lastName, contactNumber, collegeName, areasOfInterest } = req.body;
      
      const participant = await User.findById(req.user._id || req.user.id);
      
      if (firstName) participant.firstName = firstName;
      if (lastName !== undefined) participant.lastName = lastName;
      if (contactNumber) participant.contactNumber = contactNumber;
      if (collegeName) participant.collegeName = collegeName;
      if (areasOfInterest) participant.areasOfInterest = areasOfInterest;

      await participant.save();
      
      res.json({ message: "Profile updated successfully", participant });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Change password
router.put(
  "/change-password",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      const participant = await User.findById(req.user._id || req.user.id);
      
      // Verify current password
      const isMatch = await participant.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update to new password
      participant.password = newPassword;
      await participant.save();
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Follow organizer
router.post(
  "/follow/:organizerId",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const participant = await User.findById(req.user._id || req.user.id);
      const organizerId = req.params.organizerId;

      if (!participant.followedOrganizers.includes(organizerId)) {
        participant.followedOrganizers.push(organizerId);
        await participant.save();
        res.json({ message: "Followed successfully" });
      } else {
        res.status(400).json({ error: "Already following this organizer" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Unfollow organizer
router.delete(
  "/follow/:organizerId",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const participant = await User.findById(req.user._id || req.user.id);
      const organizerId = req.params.organizerId;

      const index = participant.followedOrganizers.indexOf(organizerId);
      
      if (index > -1) {
        participant.followedOrganizers.splice(index, 1);
        await participant.save();
        res.json({ message: "Unfollowed successfully" });
      } else {
        res.status(400).json({ error: "Not following this organizer" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all organizers/clubs
router.get(
  "/organizers",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const { search, category } = req.query;
      
      let query = {
        role: "organizer",
        isApproved: true
      };
      
      // Add search filter
      if (search) {
        query.$or = [
          { organizerName: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }
      
      // Add category filter
      if (category) {
        query.category = category;
      }

      const organizers = await User.find(query)
        .select("organizerName category description contactEmail discordWebhook");

      // Add event count for each organizer
      const organizersWithCounts = await Promise.all(
        organizers.map(async (organizer) => {
          const eventCount = await Event.countDocuments({ 
            organizerId: organizer._id,
            status: { $in: ["published", "ongoing", "completed"] }
          });
          
          return {
            ...organizer.toObject(),
            eventCount
          };
        })
      );

      res.json(organizersWithCounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get organizer details with events
router.get(
  "/organizers/:organizerId",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const organizer = await User.findOne({
        _id: req.params.organizerId,
        role: "organizer",
        isApproved: true
      }).select("organizerName category description contactEmail");

      if (!organizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }

      const upcomingEvents = await Event.find({
        organizerId: organizer._id,
        status: "published",
        eventStartDate: { $gte: new Date() }
      }).sort({ eventStartDate: 1 });

      const pastEvents = await Event.find({
        organizerId: organizer._id,
        status: { $in: ["completed", "closed"] }
      }).sort({ eventStartDate: -1 });

      res.json({
        organizer,
        upcomingEvents,
        pastEvents
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get my tickets/registrations
router.get(
  "/tickets",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        participantId: req.user._id || req.user.id,
        registrationStatus: "registered"
      })
        .populate("eventId", "eventName eventStartDate venue")
        .sort({ createdAt: -1 });

      res.json(registrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get specific ticket details
router.get(
  "/tickets/:ticketId",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const registration = await Registration.findOne({
        ticketId: req.params.ticketId,
        participantId: req.user._id || req.user.id
      })
        .populate("eventId")
        .populate("participantId", "firstName lastName email");

      if (!registration) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Cancel registration
router.put(
  "/registrations/:registrationId/cancel",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const registration = await Registration.findOne({
        _id: req.params.registrationId,
        participantId: req.user._id || req.user.id
      }).populate("eventId");

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      if (registration.registrationStatus !== "registered") {
        return res.status(400).json({ error: "Cannot cancel this registration" });
      }

      // Check if event has started
      if (new Date() >= new Date(registration.eventId.eventStartDate)) {
        return res.status(400).json({ error: "Cannot cancel after event has started" });
      }

      registration.registrationStatus = "cancelled";
      await registration.save();

      // Update event stats
      const event = await Event.findById(registration.eventId._id);
      event.totalRegistrations -= 1;
      event.totalRevenue -= registration.paymentAmount;
      await event.save();

      res.json({ message: "Registration cancelled successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
