const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./src/config/db");
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (payment proofs)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Felicity Event Management API",
    status: "running",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        profile: "GET /auth/me"
      },
      events: {
        browse: "GET /events",
        details: "GET /events/:id",
        register: "POST /events/:id/register",
        trending: "GET /events/trending"
      },
      participant: {
        dashboard: "GET /participant/dashboard",
        profile: "GET /participant/profile",
        tickets: "GET /participant/tickets"
      },
      organizer: {
        dashboard: "GET /organizer/dashboard",
        createEvent: "POST /events/create",
        myEvents: "GET /organizer/events/:id"
      },
      admin: {
        dashboard: "GET /admin/dashboard",
        manageOrganizers: "GET /admin/organizers",
        createOrganizer: "POST /admin/organizers"
      }
    }
  });
});

// Routes
const authRoutes = require("./src/routes/auth");
app.use("/auth", authRoutes);

const adminRoutes = require("./src/routes/admin.routes");
app.use("/admin", adminRoutes);

const organizerRoutes = require("./src/routes/organizer.routes");
app.use("/organizer", organizerRoutes);

const eventRoutes = require("./src/routes/event.routes");
app.use("/events", eventRoutes);

const participantRoutes = require("./src/routes/participant.routes");
app.use("/participant", participantRoutes);

const forumRoutes = require("./src/routes/forum.routes");
app.use("/events", forumRoutes);

const feedbackRoutes = require("./src/routes/feedback.routes");
app.use("/events", feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});


