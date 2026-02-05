const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const { sendOrganizerCredentials } = require("../utils/emailService");

// Admin dashboard
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const totalOrganizers = await User.countDocuments({ role: "organizer" });
      const approvedOrganizers = await User.countDocuments({ role: "organizer", isApproved: true });
      const totalParticipants = await User.countDocuments({ role: "participant" });
      const pendingPasswordResets = await User.countDocuments({ passwordResetRequested: true });

      res.json({
        totalOrganizers,
        approvedOrganizers,
        totalParticipants,
        pendingPasswordResets
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all organizers
router.get(
  "/organizers",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const organizers = await User.find({ role: "organizer" })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(organizers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create new organizer
router.post(
  "/organizers",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { organizerName, category, description, contactEmail } = req.body;

      // Generate credentials
      const email = `${organizerName.toLowerCase().replace(/\s+/g, "_")}@felicity.org`;
      const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
      const hashedPassword = bcrypt.hashSync(tempPassword, 10);

      const organizer = new User({
        email,
        password: hashedPassword,
        role: "organizer",
        organizerName,
        category,
        description,
        contactEmail,
        isApproved: true
      });

      await organizer.save();

      // Send credentials via email
      await sendOrganizerCredentials(contactEmail, organizerName, {
        email,
        password: tempPassword
      });

      res.json({
        message: "Organizer created successfully",
        organizer: {
          id: organizer._id,
          email,
          tempPassword, // Return for admin to share if email fails
          organizerName
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Remove/disable organizer
router.delete(
  "/organizers/:organizerId",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { permanent } = req.query;

      if (permanent === "true") {
        // Permanently delete
        await User.findByIdAndDelete(req.params.organizerId);
        res.json({ message: "Organizer permanently deleted" });
      } else {
        // Disable account
        const organizer = await User.findById(req.params.organizerId);
        organizer.isApproved = false;
        await organizer.save();
        res.json({ message: "Organizer account disabled" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Enable organizer account
router.put(
  "/organizers/:organizerId/enable",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const organizer = await User.findById(req.params.organizerId);
      organizer.isApproved = true;
      await organizer.save();

      res.json({ message: "Organizer account enabled" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get password reset requests
router.get(
  "/password-reset-requests",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const requests = await User.find({
        role: "organizer",
        passwordResetRequested: true
      }).select("organizerName email contactEmail createdAt");

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Reset organizer password
router.post(
  "/reset-password/:organizerId",
  authMiddleware,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const organizer = await User.findById(req.params.organizerId);

      if (!organizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }

      // Generate new password
      const newPassword = Math.random().toString(36).slice(-8) + "Aa1!";
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      organizer.password = hashedPassword;
      organizer.passwordResetRequested = false;
      await organizer.save();

      // Send new credentials
      await sendOrganizerCredentials(organizer.contactEmail, organizer.organizerName, {
        email: organizer.email,
        password: newPassword
      });

      res.json({
        message: "Password reset successfully",
        newPassword // Return for admin to share if email fails
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Request password reset (organizer calls this)
router.post(
  "/request-password-reset",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const organizer = await User.findById(req.user._id || req.user.id);
      organizer.passwordResetRequested = true;
      await organizer.save();

      res.json({ message: "Password reset request submitted. Admin will process your request." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
