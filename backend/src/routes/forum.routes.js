const express = require("express");
const router = express.Router();
const ForumMessage = require("../models/ForumMessage");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const authMiddleware = require("../middleware/auth");

// Get all forum messages for an event
router.get(
  "/:eventId/forum",
  authMiddleware,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      
      // Check if user has access to this event (registered participant or organizer)
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizerId.toString() === (req.user._id || req.user.id).toString();
      
      if (!isOrganizer && req.user.role === "participant") {
        const registration = await Registration.findOne({
          eventId,
          participantId: req.user._id || req.user.id,
          registrationStatus: "registered"
        });
        
        if (!registration) {
          return res.status(403).json({ error: "You must be registered for this event to access the forum" });
        }
      }

      // Get all non-deleted messages
      const messages = await ForumMessage.find({ 
        eventId, 
        deleted: false 
      })
        .populate("userId", "firstName lastName organizerName role")
        .populate("parentMessageId")
        .sort({ isPinned: -1, createdAt: -1 })
        .lean();

      // Get reply counts for each message
      const messagesWithReplies = await Promise.all(
        messages.map(async (msg) => {
          const replyCount = await ForumMessage.countDocuments({
            parentMessageId: msg._id,
            deleted: false
          });
          return { ...msg, replyCount };
        })
      );

      res.json(messagesWithReplies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Post a new message
router.post(
  "/:eventId/forum",
  authMiddleware,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { content, parentMessageId, isAnnouncement } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Check if user has access
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizerId.toString() === (req.user._id || req.user.id).toString();
      
      if (!isOrganizer && req.user.role === "participant") {
        const registration = await Registration.findOne({
          eventId,
          participantId: req.user._id || req.user.id,
          registrationStatus: "registered"
        });
        
        if (!registration) {
          return res.status(403).json({ error: "You must be registered for this event to post" });
        }
      }

      // Only organizers can post announcements
      if (isAnnouncement && !isOrganizer) {
        return res.status(403).json({ error: "Only organizers can post announcements" });
      }

      // Create message
      const message = new ForumMessage({
        eventId,
        userId: req.user._id || req.user.id,
        userRole: req.user.role,
        content: content.trim(),
        parentMessageId: parentMessageId || null,
        isAnnouncement: isAnnouncement && isOrganizer
      });

      await message.save();
      await message.populate("userId", "firstName lastName organizerName role");

      res.json({ 
        message: "Message posted successfully",
        forumMessage: message 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete a message (organizer only)
router.delete(
  "/:eventId/forum/:messageId",
  authMiddleware,
  async (req, res) => {
    try {
      const { eventId, messageId } = req.params;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizerId.toString() === (req.user._id || req.user.id).toString();
      if (!isOrganizer) {
        return res.status(403).json({ error: "Only organizers can delete messages" });
      }

      const message = await ForumMessage.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Soft delete
      message.deleted = true;
      message.deletedBy = req.user._id || req.user.id;
      message.deletedAt = new Date();
      await message.save();

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Pin/unpin a message (organizer only)
router.put(
  "/:eventId/forum/:messageId/pin",
  authMiddleware,
  async (req, res) => {
    try {
      const { eventId, messageId } = req.params;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizerId.toString() === (req.user._id || req.user.id).toString();
      if (!isOrganizer) {
        return res.status(403).json({ error: "Only organizers can pin messages" });
      }

      const message = await ForumMessage.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      message.isPinned = !message.isPinned;
      await message.save();

      res.json({ 
        message: message.isPinned ? "Message pinned" : "Message unpinned",
        isPinned: message.isPinned
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// React to a message
router.post(
  "/:eventId/forum/:messageId/react",
  authMiddleware,
  async (req, res) => {
    try {
      const { eventId, messageId } = req.params;
      const { reactionType } = req.body;

      if (!["like", "heart", "thumbsup", "thumbsdown", "question"].includes(reactionType)) {
        return res.status(400).json({ error: "Invalid reaction type" });
      }

      const message = await ForumMessage.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      const userId = (req.user._id || req.user.id).toString();
      
      // Check if user already reacted
      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId.toString() === userId
      );

      if (existingReactionIndex !== -1) {
        // If same reaction, remove it; otherwise update it
        if (message.reactions[existingReactionIndex].type === reactionType) {
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          message.reactions[existingReactionIndex].type = reactionType;
        }
      } else {
        // Add new reaction
        message.reactions.push({
          userId: req.user._id || req.user.id,
          type: reactionType
        });
      }

      await message.save();

      res.json({ 
        message: "Reaction updated",
        reactions: message.reactions
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get replies to a message
router.get(
  "/:eventId/forum/:messageId/replies",
  authMiddleware,
  async (req, res) => {
    try {
      const { messageId } = req.params;

      const replies = await ForumMessage.find({ 
        parentMessageId: messageId,
        deleted: false 
      })
        .populate("userId", "firstName lastName organizerName role")
        .sort({ createdAt: 1 })
        .lean();

      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
