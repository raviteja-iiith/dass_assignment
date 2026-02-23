const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/users");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const { generateQRCode } = require("../utils/qrService");
const { sendTicketEmail } = require("../utils/emailService");

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

// Change password
router.put(
  "/change-password",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      const organizer = await User.findById(req.user._id || req.user.id);
      
      // Verify current password
      const isMatch = await organizer.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update to new password
      organizer.password = newPassword;
      await organizer.save();
      
      res.json({ message: "Password changed successfully" });
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

// ============= MERCHANDISE PAYMENT APPROVAL WORKFLOW =============

// Get all merchandise orders for organizer's events
router.get(
  "/merchandise-orders",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;
      
      // Get all merchandise events by this organizer
      const events = await Event.find({ 
        organizerId, 
        eventType: "merchandise" 
      });
      
      const eventIds = events.map(e => e._id);
      
      // Get all merchandise orders
      const orders = await Registration.find({
        eventId: { $in: eventIds },
        registrationType: "merchandise"
      })
        .populate("participantId", "firstName lastName email contactNumber")
        .populate("eventId", "eventName merchandiseDetails")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Approve merchandise payment
router.put(
  "/merchandise-orders/:registrationId/approve",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const registration = await Registration.findById(req.params.registrationId)
        .populate("eventId")
        .populate("participantId", "firstName lastName email");

      if (!registration) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify organizer owns this event
      if (registration.eventId.organizerId.toString() !== (req.user._id || req.user.id).toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (registration.paymentApprovalStatus === "approved") {
        return res.status(400).json({ error: "Payment already approved" });
      }

      // Update approval status
      registration.paymentApprovalStatus = "approved";
      registration.paymentStatus = "completed";
      registration.paymentDate = new Date();

      // Generate QR code now
      const qrData = {
        ticketId: registration.ticketId,
        eventId: registration.eventId._id,
        participantId: registration.participantId._id,
        merchandise: {
          item: registration.eventId.merchandiseDetails.itemName,
          variant: registration.merchandisePurchase.variant,
          quantity: registration.merchandisePurchase.quantity
        },
        timestamp: new Date().toISOString()
      };
      registration.qrCode = await generateQRCode(qrData);

      await registration.save();

      // Decrement stock
      const event = registration.eventId;
      const variantIndex = event.merchandiseDetails.variants.findIndex(
        v => v.size === registration.merchandisePurchase.variant.size && 
             v.color === registration.merchandisePurchase.variant.color
      );
      
      if (variantIndex !== -1) {
        event.merchandiseDetails.variants[variantIndex].sold += registration.merchandisePurchase.quantity;
        event.merchandiseDetails.variants[variantIndex].stockQuantity -= registration.merchandisePurchase.quantity;
      }
      
      event.totalRegistrations += 1;
      event.totalRevenue += registration.paymentAmount;
      await event.save();

      // Send confirmation email with QR code
      const emailSent = await sendTicketEmail(
        registration.participantId.email,
        `${registration.participantId.firstName} ${registration.participantId.lastName || ""}`,
        {
          ticketId: registration.ticketId,
          eventName: event.merchandiseDetails.itemName,
          eventDate: event.eventStartDate,
          amount: registration.paymentAmount,
          qrCode: registration.qrCode
        }
      );

      if (emailSent) {
        registration.emailSent = true;
        await registration.save();
      }

      res.json({ 
        message: "Payment approved successfully. QR code generated and email sent.",
        registration 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Reject merchandise payment
router.put(
  "/merchandise-orders/:registrationId/reject",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const registration = await Registration.findById(req.params.registrationId)
        .populate("eventId");

      if (!registration) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify organizer owns this event
      if (registration.eventId.organizerId.toString() !== (req.user._id || req.user.id).toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (registration.paymentApprovalStatus === "rejected") {
        return res.status(400).json({ error: "Payment already rejected" });
      }

      // Update approval status
      registration.paymentApprovalStatus = "rejected";
      registration.paymentStatus = "failed";
      registration.paymentRejectionReason = reason || "Payment proof not valid";
      registration.registrationStatus = "rejected";

      await registration.save();

      res.json({ 
        message: "Payment rejected successfully.",
        registration 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============= QR SCANNER & ATTENDANCE TRACKING =============

// Scan QR code and mark attendance
router.post(
  "/events/:eventId/scan",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { ticketId } = req.body;
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id || req.user.id
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      const registration = await Registration.findOne({ ticketId, eventId: event._id })
        .populate("participantId", "firstName lastName email");

      if (!registration) {
        return res.status(404).json({ error: "Invalid ticket for this event" });
      }

      if (registration.registrationStatus !== "registered") {
        return res.status(400).json({ error: "Registration is cancelled or rejected" });
      }

      // For merchandise, check payment approval
      if (registration.registrationType === "merchandise" && registration.paymentApprovalStatus !== "approved") {
        return res.status(400).json({ error: "Payment not approved yet" });
      }

      // Check for duplicate scan
      if (registration.attended) {
        return res.status(400).json({ 
          error: "Duplicate scan detected",
          message: `Already scanned at ${registration.attendanceMarkedAt}`,
          registration
        });
      }

      // Mark attendance
      registration.attended = true;
      registration.attendanceMarkedAt = new Date();
      registration.attendanceLog.push({
        timestamp: new Date(),
        scannedBy: req.user._id || req.user.id,
        type: "scan",
        notes: "QR code scanned"
      });

      await registration.save();

      // Update event attendance count
      event.totalAttendance += 1;
      await event.save();

      res.json({ 
        message: "Attendance marked successfully",
        participant: registration.participantId,
        registration
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get attendance list for an event
router.get(
  "/events/:eventId/attendance",
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

      const registrations = await Registration.find({ 
        eventId: event._id,
        registrationStatus: "registered"
      })
        .populate("participantId", "firstName lastName email contactNumber")
        .populate({
          path: "attendanceLog.scannedBy",
          select: "organizerName firstName lastName"
        })
        .sort({ attended: -1, attendanceMarkedAt: -1 });

      const stats = {
        total: registrations.length,
        attended: registrations.filter(r => r.attended).length,
        notAttended: registrations.filter(r => !r.attended).length,
        attendanceRate: registrations.length > 0 ? 
          ((registrations.filter(r => r.attended).length / registrations.length) * 100).toFixed(2) : 0
      };

      res.json({
        event,
        registrations,
        stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Manual attendance override
router.post(
  "/events/:eventId/manual-attendance",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { registrationId, reason } = req.body;
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id || req.user.id
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      const registration = await Registration.findById(registrationId)
        .populate("participantId", "firstName lastName email");

      if (!registration || registration.eventId.toString() !== event._id.toString()) {
        return res.status(404).json({ error: "Registration not found" });
      }

      if (registration.attended) {
        return res.status(400).json({ error: "Attendance already marked" });
      }

      // Mark attendance with manual override
      registration.attended = true;
      registration.attendanceMarkedAt = new Date();
      registration.manualOverride = true;
      registration.overrideReason = reason || "Manual override by organizer";
      registration.attendanceLog.push({
        timestamp: new Date(),
        scannedBy: req.user._id || req.user.id,
        type: "manual",
        notes: reason || "Manual override by organizer"
      });

      await registration.save();

      // Update event attendance count
      event.totalAttendance += 1;
      await event.save();

      res.json({ 
        message: "Attendance marked manually",
        registration
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Export attendance as CSV
router.get(
  "/events/:eventId/attendance/export",
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

      const registrations = await Registration.find({ 
        eventId: event._id,
        registrationStatus: "registered"
      })
        .populate("participantId", "firstName lastName email contactNumber")
        .sort({ attendanceMarkedAt: -1 });

      // Create CSV
      let csv = "Ticket ID,First Name,Last Name,Email,Contact,Attended,Attendance Time,Manual Override,Override Reason\n";
      
      registrations.forEach(reg => {
        if (reg.participantId) {
          csv += `${reg.ticketId},`;
          csv += `${reg.participantId.firstName},`;
          csv += `${reg.participantId.lastName || ""},`;
          csv += `${reg.participantId.email},`;
          csv += `${reg.participantId.contactNumber || ""},`;
          csv += `${reg.attended ? "Yes" : "No"},`;
          csv += `${reg.attendanceMarkedAt ? new Date(reg.attendanceMarkedAt).toLocaleString() : ""},`;
          csv += `${reg.manualOverride ? "Yes" : "No"},`;
          csv += `"${reg.overrideReason || ""}"\n`;
        }
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=attendance_${event.eventName}_${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============= PASSWORD RESET REQUEST WORKFLOW =============

// Submit password reset request
router.post(
  "/request-password-reset",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const organizerId = req.user._id || req.user.id;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Reason is required" });
      }

      // Check if there's already a pending request
      const existingRequest = await PasswordResetRequest.findOne({
        organizerId,
        status: "pending"
      });

      if (existingRequest) {
        return res.status(400).json({ 
          error: "You already have a pending password reset request" 
        });
      }

      // Create new request
      const request = new PasswordResetRequest({
        organizerId,
        reason: reason.trim()
      });

      await request.save();

      // Update user flag
      const organizer = await User.findById(organizerId);
      organizer.passwordResetRequested = true;
      await organizer.save();

      res.json({ 
        message: "Password reset request submitted successfully. Admin will review your request.",
        request
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get password reset request history
router.get(
  "/password-reset-history",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;
      
      const requests = await PasswordResetRequest.find({ organizerId })
        .populate("processedBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
