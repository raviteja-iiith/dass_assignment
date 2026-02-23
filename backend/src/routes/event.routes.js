const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/users");

const authMiddleware = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const upload = require("../middleware/upload");
const { generateQRCode, generateTicketId } = require("../utils/qrService");
const { sendTicketEmail } = require("../utils/emailService");
const { postEventToDiscord } = require("../utils/discordService");

// Create event (draft) - Organizer only
router.post(
  "/create",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = new Event({
        ...req.body,
        organizerId: req.user._id || req.user.id,
        status: "draft"
      });

      await event.save();
      res.json({ message: "Event created as draft", eventId: event._id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Publish event - Organizer only
router.put(
  "/:eventId/publish",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = await Event.findOne({ _id: req.params.eventId, organizerId: req.user._id || req.user.id });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }
      
      if (event.status !== "draft") {
        return res.status(400).json({ error: "Only draft events can be published" });
      }

      event.status = "published";
      await event.save();

      // Post to Discord if webhook configured
      const organizer = await User.findById(event.organizerId);
      if (organizer && organizer.discordWebhook) {
        await postEventToDiscord(organizer.discordWebhook, event);
      }

      res.json({ message: "Event published successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update event - Organizer only
router.put(
  "/:eventId",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const event = await Event.findOne({ _id: req.params.eventId, organizerId: req.user._id || req.user.id });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      // Edit rules based on status
      if (event.status === "draft") {
        // Full edit allowed
        Object.assign(event, req.body);
      } else if (event.status === "published") {
        // Limited edits: description, deadline, limit
        const allowedUpdates = ["eventDescription", "registrationDeadline", "registrationLimit"];
        allowedUpdates.forEach(field => {
          if (req.body[field] !== undefined) {
            event[field] = req.body[field];
          }
        });
      } else {
        return res.status(400).json({ error: "Cannot edit ongoing/completed events" });
      }

      await event.save();
      res.json({ message: "Event updated successfully", event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update event status - Organizer only
router.put(
  "/:eventId/status",
  authMiddleware,
  allowRoles("organizer"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const event = await Event.findOne({ _id: req.params.eventId, organizerId: req.user._id || req.user.id });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }

      event.status = status;
      await event.save();

      res.json({ message: "Event status updated", status: event.status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all events with filters (authenticated users)
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        search, 
        eventType, 
        eligibility, 
        startDate, 
        endDate, 
        followedOnly,
        status,
        sortBy // New parameter: 'recent', 'relevant', 'popular'
      } = req.query;

      let query = { status: status || "published" };

      // Search
      if (search) {
        query.$text = { $search: search };
      }

      // Filters
      if (eventType) query.eventType = eventType;
      if (eligibility) query.eligibility = eligibility;
      if (startDate || endDate) {
        query.eventStartDate = {};
        if (startDate) query.eventStartDate.$gte = new Date(startDate);
        if (endDate) query.eventStartDate.$lte = new Date(endDate);
      }

      // Followed organizers filter
      let participant = null;
      if (req.user.role === "participant") {
        participant = await User.findById(req.user._id || req.user.id);
      }

      if (followedOnly === "true" && participant) {
        if (participant.followedOrganizers.length > 0) {
          query.organizerId = { $in: participant.followedOrganizers };
        }
      }

      let events = await Event.find(query)
        .populate("organizerId", "organizerName email")
        .limit(100);

      // Apply relevance sorting if requested and user is participant
      if (sortBy === "relevant" && participant) {
        const interests = participant.areasOfInterest || [];
        
        events = events.map(event => {
          let score = 0;
          
          // Match interests with tags
          if (interests.length > 0 && event.eventTags.length > 0) {
            const matches = event.eventTags.filter(tag =>
              interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
            );
            score += matches.length * 10;
          }
          
          // Followed organizer bonus
          if (participant.followedOrganizers.some(id => 
            id.toString() === event.organizerId._id.toString()
          )) {
            score += 20;
          }
          
          return { ...event.toObject(), relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
      } else if (sortBy === "popular") {
        events.sort((a, b) => b.views - a.views);
      } else {
        // Default: sort by recent (createdAt)
        events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get trending events (Top 5 by views in last 24h)
router.get(
  "/trending",
  authMiddleware,
  async (req, res) => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const events = await Event.find({
        status: "published",
        lastViewReset: { $gte: oneDayAgo }
      })
        .sort({ views: -1 })
        .limit(5)
        .populate("organizerId", "organizerName");

      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get recommended events based on user preferences
router.get(
  "/recommended",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const participant = await User.findById(req.user._id || req.user.id);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      const interests = participant.areasOfInterest || [];
      const followedOrgs = participant.followedOrganizers || [];

      // Get all published events
      const events = await Event.find({ status: "published" })
        .populate("organizerId", "organizerName");

      // Calculate recommendation score for each event
      const scoredEvents = events.map(event => {
        let score = 0;

        // Score based on matching interests with event tags
        if (interests.length > 0 && event.eventTags.length > 0) {
          const matchingTags = event.eventTags.filter(tag => 
            interests.some(interest => 
              interest.toLowerCase() === tag.toLowerCase()
            )
          );
          score += matchingTags.length * 10; // 10 points per matching tag
        }

        // Bonus score if event is from followed organizer
        if (followedOrgs.length > 0) {
          const isFollowed = followedOrgs.some(orgId => 
            orgId.toString() === event.organizerId._id.toString()
          );
          if (isFollowed) {
            score += 20; // 20 bonus points for followed organizer
          }
        }

        // Bonus for recent events (decay over time)
        const daysUntilEvent = Math.ceil(
          (new Date(event.eventStartDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilEvent > 0 && daysUntilEvent <= 30) {
          score += Math.max(0, 30 - daysUntilEvent); // More points for sooner events
        }

        return {
          ...event.toObject(),
          recommendationScore: score
        };
      });

      // Sort by score and return top recommendations
      const recommended = scoredEvents
        .filter(e => e.recommendationScore > 0)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);

      res.json(recommended);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get event details by ID
router.get(
  "/:eventId",
  authMiddleware,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId)
        .populate("organizerId", "organizerName category description contactEmail");

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Increment view count
      event.views += 1;
      await event.save();

      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Register for normal event - Participant only
router.post(
  "/:eventId/register",
  authMiddleware,
  allowRoles("participant"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Validations
      if (event.status !== "published") {
        return res.status(400).json({ error: "Event not open for registration" });
      }

      if (new Date() > new Date(event.registrationDeadline)) {
        return res.status(400).json({ error: "Registration deadline passed" });
      }

      if (event.registrationLimit > 0 && event.totalRegistrations >= event.registrationLimit) {
        return res.status(400).json({ error: "Registration limit reached" });
      }

      // Check eligibility
      const participant = await User.findById(req.user._id || req.user.id);
      if (event.eligibility === "IIIT-only" && participant.participantType !== "IIIT") {
        return res.status(403).json({ error: "This event is only for IIIT students" });
      }
      if (event.eligibility === "Non-IIIT-only" && participant.participantType === "IIIT") {
        return res.status(403).json({ error: "This event is only for Non-IIIT participants" });
      }

      // Check duplicate registration
      const existingReg = await Registration.findOne({
        eventId: event._id,
        participantId: participant._id
      });

      if (existingReg) {
        return res.status(400).json({ error: "Already registered for this event" });
      }

      // Lock custom form after first registration
      if (!event.formLocked && event.totalRegistrations === 0) {
        event.formLocked = true;
      }

      // Generate ticket
      const ticketId = generateTicketId();
      const qrData = {
        ticketId,
        eventId: event._id,
        participantId: participant._id,
        eventName: event.eventName,
        participantName: `${participant.firstName} ${participant.lastName || ""}`,
        timestamp: new Date().toISOString()
      };
      const qrCode = await generateQRCode(qrData);

      // Create registration
      const registration = new Registration({
        ticketId,
        eventId: event._id,
        participantId: participant._id,
        registrationType: "normal",
        formResponses: req.body.formResponses || {},
        paymentAmount: event.registrationFee,
        paymentStatus: "completed", // Normal events auto-approve (no payment approval workflow)
        registrationStatus: "registered",
        qrCode
      });

      await registration.save();

      // Update event stats
      event.totalRegistrations += 1;
      event.totalRevenue += event.registrationFee;
      await event.save();

      // Send email
      const emailSent = await sendTicketEmail(participant.email, `${participant.firstName} ${participant.lastName || ""}`, {
        ticketId,
        eventName: event.eventName,
        eventDate: event.eventStartDate,
        venue: event.venue,
        amount: event.registrationFee,
        qrCode
      });

      if (emailSent) {
        registration.emailSent = true;
        await registration.save();
      }

      res.json({
        message: "Registration successful",
        ticketId,
        registration
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Purchase merchandise - Participant only
router.post(
  "/:eventId/purchase",
  authMiddleware,
  allowRoles("participant"),
  upload.single("paymentProof"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      
      if (!event || event.eventType !== "merchandise") {
        return res.status(404).json({ error: "Merchandise event not found" });
      }

      if (event.status !== "published") {
        return res.status(400).json({ error: "Event not open for purchase" });
      }

      if (new Date() > new Date(event.registrationDeadline)) {
        return res.status(400).json({ error: "Purchase deadline passed" });
      }

      const { variantIndex, quantity } = req.body;
      const variant = event.merchandiseDetails.variants[variantIndex];

      // Check stock availability (blocking requirement)
      if (!variant || variant.stockQuantity < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      // Check purchase limit
      const participant = await User.findById(req.user._id || req.user.id);
      const previousPurchases = await Registration.countDocuments({
        eventId: event._id,
        participantId: participant._id,
        registrationStatus: "registered"
      });

      if (previousPurchases >= event.merchandiseDetails.purchaseLimitPerParticipant) {
        return res.status(400).json({ error: "Purchase limit reached" });
      }

      // Validate payment proof upload
      if (!req.file) {
        return res.status(400).json({ error: "Payment proof is required" });
      }

      // Generate ticket ID and QR code (requirement: ticket with QR is generated)
      const ticketId = generateTicketId();
      const totalPrice = event.registrationFee * quantity;

      // Create registration with PENDING approval status
      // QR code, stock decrement, and email will be processed upon organizer approval
      const registration = new Registration({
        ticketId,
        eventId: event._id,
        participantId: participant._id,
        registrationType: "merchandise",
        merchandisePurchase: {
          variant: {
            size: variant.size,
            color: variant.color
          },
          quantity,
          totalPrice
        },
        paymentAmount: totalPrice,
        paymentStatus: "pending",
        paymentProof: `/uploads/payment-proofs/${req.file.filename}`,
        paymentApprovalStatus: "pending", // Awaiting organizer approval
        qrCode: null // Will be generated upon approval
      });

      await registration.save();

      res.json({
        message: "Payment proof uploaded successfully! Your order is pending organizer approval.",
        ticketId,
        registration
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
