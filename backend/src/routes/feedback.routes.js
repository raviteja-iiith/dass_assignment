const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");

// Submit feedback for an event (Participant only)
router.post("/:eventId/feedback", authMiddleware, allowRoles("participant"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const participantId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: "Comment is required" });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if participant has attended the event (has a registered registration)
    const registration = await Registration.findOne({
      eventId,
      participantId,
      registrationStatus: "registered"
    });

    if (!registration) {
      return res.status(403).json({ error: "You must be registered for this event to submit feedback" });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ eventId, participantId });
    if (existingFeedback) {
      return res.status(400).json({ error: "You have already submitted feedback for this event" });
    }

    // Create feedback
    const feedback = new Feedback({
      eventId,
      participantId,
      rating: parseInt(rating),
      comment: comment.trim()
    });

    await feedback.save();

    res.status(201).json({ 
      message: "Feedback submitted successfully",
      feedback: {
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// Get feedback for an event with filters (Organizer only)
router.get("/:eventId/feedback", authMiddleware, allowRoles("organizer"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating } = req.query;
    const organizerId = req.user._id;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ error: "Unauthorized access to event feedback" });
    }

    // Build query
    const query = { eventId };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Fetch feedback (anonymous - don't include participantId)
    const feedbacks = await Feedback.find(query)
      .select("-participantId -__v")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Get aggregated feedback stats for an event (Organizer only)
router.get("/:eventId/feedback/stats", authMiddleware, allowRoles("organizer"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user._id;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ error: "Unauthorized access to event feedback" });
    }

    // Get aggregated stats
    const stats = await Feedback.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    // Calculate rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      });
    }

    const result = stats.length > 0 ? {
      totalFeedbacks: stats[0].totalFeedbacks,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      ratingDistribution: ratingCounts
    } : {
      totalFeedbacks: 0,
      averageRating: 0,
      ratingDistribution: ratingCounts
    };

    res.json(result);
  } catch (error) {
    console.error("Get feedback stats error:", error);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
});

module.exports = router;
