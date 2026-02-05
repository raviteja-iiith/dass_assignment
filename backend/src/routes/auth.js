const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/users");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Participant registration
router.post("/register", async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      participantType, 
      collegeName, 
      contactNumber,
      areasOfInterest,
      followedOrganizers
    } = req.body;

    // Email domain validation for IIIT participants
    if (participantType === "IIIT") {
      const emailDomain = email.split("@")[1];
      if (!emailDomain || !emailDomain.includes("iiit.ac.in")) {
        return res.status(400).json({ error: "IIIT participants must use IIIT email address" });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "participant",
      participantType,
      collegeName,
      contactNumber,
      areasOfInterest: areasOfInterest || [],
      followedOrganizers: followedOrganizers || []
    });

    await user.save();
    
    res.json({ 
      message: "Registration successful",
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if organizer account is approved
    if (user.role === "organizer" && !user.isApproved) {
      return res.status(403).json({ error: "Your account is not approved yet" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { 
        _id: user._id,
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        organizerName: user.organizerName
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize admin user (call this once)
// const initializeAdmin = async () => {
//   try {
//     const existingAdmin = await users.findOne({ email: "admin2@iiit.ac.in" });
//     if (!existingAdmin) {
//       await new users({
//         firstName: "Admin2",
//         email: "admin2@iiit.ac.in",
//         password: bcrypt.hashSync("admin123", 10),
//         role: "admin"
//       }).save();
//       console.log("Admin user created");
//     }
//   } catch (err) {
//     console.error("Error creating admin:", err.message);
//   }
// };

// Call it immediately
//initializeAdmin();

router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
