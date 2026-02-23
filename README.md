# Felicity - Event Management System

A comprehensive full-stack event management platform built with React, Node.js, Express, and MongoDB. Felicity enables organizers to create and manage events while providing participants with seamless registration, QR-based attendance tracking, real-time discussions, and anonymous feedback capabilities.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Advanced Features Implemented](#advanced-features-implemented)
- [Setup and Installation](#setup-and-installation)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

---

## Technology Stack

### Backend Dependencies

| Library/Framework | Version | Justification |
|------------------|---------|---------------|
| **Express.js** | ^4.22.1 | Industry-standard web framework for Node.js. Chosen for its minimal overhead, robust middleware ecosystem, and excellent routing capabilities. Provides flexible API endpoint management and middleware chaining for authentication/authorization. |
| **MongoDB (Mongoose)** | ^9.1.5 | NoSQL database with schema validation via Mongoose ODM. Selected for its flexible document structure ideal for event data with varying fields, excellent scalability, and powerful aggregation framework for analytics (feedback stats, registration counts). |
| **JSON Web Tokens (jsonwebtoken)** | ^9.0.3 | Stateless authentication mechanism. Chosen over session-based auth for better scalability, mobile app compatibility, and distributed system support. Enables secure token-based authentication across frontend-backend communication. |
| **bcryptjs** | ^3.0.3 | Password hashing library using bcrypt algorithm. Essential for secure password storage with salt rounds. Preferred over crypto for automatic salt generation and resistance to rainbow table attacks. |
| **Nodemailer** | ^7.0.13 | Email delivery service for transactional emails. Critical for password reset workflow, QR ticket delivery, and event notifications. Supports multiple transport methods (SMTP, SendGrid, etc.) with template customization. |
| **QRCode** | ^1.5.4 | Server-side QR code generation library. Generates unique QR codes for event tickets containing encrypted ticket IDs. Lightweight, synchronous generation ensures fast registration response times. |
| **Multer** | ^2.0.2 | Multipart/form-data handling middleware. Essential for merchandise payment proof uploads. Provides file validation, size limits, and storage engine customization (disk/memory). |
| **Axios** | ^1.13.4 | Promise-based HTTP client for Discord webhook integration. Used in forum notification system to send real-time message alerts to Discord channels. Cleaner API than native fetch with automatic JSON transformation. |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing middleware. Enables secure frontend-backend communication across different ports during development. Configured with credential support and origin whitelisting. |
| **dotenv** | ^16.6.1 | Environment variable management. Critical for securing sensitive credentials (JWT secrets, database URIs, email passwords) outside version control. Follows 12-factor app methodology. |
| **Nodemon** (dev) | ^3.0.1 | Development server with auto-restart on file changes. Significantly improves developer productivity by eliminating manual server restarts during development. |

### Frontend Dependencies

| Library/Framework | Version | Justification |
|------------------|---------|---------------|
| **React** | ^19.2.0 | Component-based UI library with virtual DOM. Chosen for its declarative syntax, massive ecosystem, hooks for state management, and excellent developer tools. Enables reusable components like TicketCard, EventCard, and FeedbackModal. |
| **React Router DOM** | ^7.13.0 | Client-side routing library. Essential for SPA navigation with protected routes for role-based access control (admin/organizer/participant). Provides programmatic navigation and URL parameter handling. |
| **Vite** | 7.2.5 (Rolldown) | Next-generation frontend build tool. Chosen over Webpack/CRA for lightning-fast hot module replacement (HMR), native ES modules support, and 10-20x faster build times. Significantly improves development experience. |
| **Tailwind CSS** | ^4.1.18 | Utility-first CSS framework. Selected over Bootstrap/Material-UI for complete design flexibility without opinionated components, tiny production bundle via PurgeCSS tree-shaking, rapid prototyping with utility classes, and easy dark mode implementation. |
| **DaisyUI** | ^5.5.18 | Component library built on Tailwind CSS. Provides pre-styled semantic components (cards, modals, buttons) while maintaining Tailwind's utility-first philosophy. Reduces custom CSS by 80% while ensuring consistent design language. |
| **Axios** | ^1.13.4 | HTTP client for API communication. Chosen for interceptor support (automatic JWT token attachment), request/response transformation, and better error handling than fetch API. Centralized API service configuration. |
| **html5-qrcode** | ^2.3.8 | QR code scanning library using device camera. Critical for attendance tracking feature. Supports both camera scanning and image file uploads. Cross-platform compatibility (mobile + desktop) with minimal configuration. |
| **PostCSS & Autoprefixer** | ^8.5.6 / ^10.4.24 | CSS post-processing tools. Autoprefixer automatically adds vendor prefixes for browser compatibility. PostCSS enables Tailwind CSS processing and CSS optimization. |
| **ESLint** | ^9.39.1 | Static code analysis tool. Enforces code quality standards, catches bugs early, and maintains consistent coding style across the team. Configured with React-specific rules for hooks and JSX. |

---

## Advanced Features Implemented

As per the assignment requirements, features were selected from three tiers:
- **Tier A**: Implement 2 features
- **Tier B**: Implement 2 features  
- **Tier C**: Implement 1 feature

---

### Tier A Features

#### Feature 1: Merchandise Payment Workflow

**Why I chose this feature:**  
Many college events need to sell merchandise like t-shirts, hoodies, and badges. Instead of relying on external payment platforms that charge transaction fees and require complex regulatory compliance, I decided to build an integrated solution. This gives organizers complete control over the payment verification process while keeping everything within the platform.

**How I approached the design:**
- Rather than integrating automated payment gateways like Razorpay or Stripe, I implemented a manual verification system where organizers approve payment proof uploads. This works better for college events where trust and community matter more than instant automation.
- Used Multer middleware to handle file uploads with a 5MB size limit and unique filename generation to avoid collisions.
- Created a three-state workflow: when someone registers for merchandise, their status starts as "Pending", moves to "Approved" after organizer verification, and finally becomes "Registered" when they can access the event.

**Implementation details:**
- Backend handles POST requests to `/participant/register` accepting merchandise registrations with file uploads
- Organizers can approve or reject via PATCH `/organizer/registrations/:id/approve` with authorization checks ensuring they can only manage their own events
- Files are stored locally in `/uploads/payment-proofs/` which eliminates third-party dependencies
- Frontend displays a paginated table in MerchandiseOrders.jsx with payment proof preview, inline approval buttons, and real-time status updates using color-coded badges

**Technical decisions I made:**
- Chose local disk storage over cloud solutions like S3 or Cloudinary to keep the setup simple and avoid external dependencies
- Added strict authorization checks to prevent organizers from approving payments for events they don't own
- Used FormData API on the frontend for multipart uploads with progress tracking so users know their files are uploading

**Implementation files:** MerchandiseOrders.jsx, participant.routes.js

---

#### Feature 2: QR Code Scanner for Attendance

**Why I chose this feature:**  
Having attended several college events, I've seen how manual attendance takes forever. With 100+ participants, each taking 2-3 minutes to sign in creates massive bottlenecks at the entrance. A QR scanner can reduce this to 5-10 seconds per person, which dramatically improves the event experience.

**How I approached the design:**
- Generate unique QR codes server-side during registration using the participant's ticketId (MongoDB ObjectId). This ensures each ticket is cryptographically unique.
- Went with html5-qrcode library instead of building custom WebRTC camera handling because it has built-in QR detection algorithms and works across different browsers without compatibility issues.
- Made the system work offline by generating QR codes immediately after registration and embedding them as data URLs, so participants can save tickets as images even without internet.

**Implementation details:**
- Backend generates QR codes using `QRCode.toDataURL(ticketId)` right after successful registration
- Attendance marking happens via PATCH `/organizer/events/:eventId/attendance/:ticketId` which validates ticket ownership and uses idempotent updates to prevent duplicate marking
- Frontend scanner component uses Html5QrcodeScanner with 250ms scan intervals for responsive detection
- Built dual-mode support: live camera scanning for quick check-ins and file upload option for participants with damaged or printed QR codes
- Added audio and visual feedback when scans succeed, with a 2-second cooldown to prevent accidental double-scans
- Real-time attendance counter and recent scan log showing the last 10 participants

**Technical decisions I made:**
- Used data URL embedding instead of external image hosting so tickets work completely offline
- Implemented regex validation on ticketId to prevent injection attempts through QR code manipulation
- Added rate limiting of 1 scan per 2 seconds to avoid duplicate attendance marking from accidental double-scans

**Implementation files:** AttendanceScanner.jsx, organizer.routes.js

---

### Tier B Features

#### Feature 3: Real-Time Discussion Forum

**Why I chose this feature:**  
Event communication usually happens on WhatsApp groups or Discord servers, which fragments the conversation and makes it hard to keep track of important announcements. By building an event-specific forum directly into the platform, participants can ask questions, organizers can make announcements, and everything stays in one place.

**How I approached the design:**
- Implemented role-based access control so only registered participants and event organizers can access forums. This prevents spam and keeps discussions relevant.
- Added moderation features where organizers can delete inappropriate messages. I used soft-delete flags (`isDeleted`) instead of hard deletes to maintain audit trails if needed.
- Built a custom notification system using localStorage and polling instead of WebSockets. While WebSockets would be more "real-time", they add significant infrastructure complexity with Socket.io dependencies and connection management. For a college event platform, polling every 5 seconds provides good enough responsiveness.

**Implementation details:**
- Backend validates user registration before allowing message posting via POST `/events/:eventId/forum`
- GET endpoint returns chronological messages with populated user details for display
- Organizers can soft-delete messages via DELETE `/events/:eventId/forum/:messageId` with authorization checks
- Frontend implements a tabbed interface with separate Discussion and Moderation views
- **Notification system works like this:**
  - localStorage tracks the last visit timestamp using `forum_last_seen_${eventId}`
  - Polling every 5 seconds fetches messages posted since last visit
  - New messages get a bouncing green "NEW" badge for visual prominence
  - Toast notifications appear with message previews and auto-hide after 5 seconds
  - Unread count banner at top with a "Mark All as Read" button
- Character counter shows remaining space out of 1000 character limit with live validation
- Messages appear immediately with optimistic UI updates before server confirmation

**Technical decisions I made:**
- Chose polling over WebSockets to avoid additional infrastructure complexity while still providing responsive updates
- Used localStorage instead of Redux for notification state because it persists across browser sessions automatically
- Implemented message deduplication by comparing timestamps to prevent showing duplicate notifications when polling
- Added `isNew` prop to MessageItem component for conditional styling of new messages

**Implementation files:** ForumDiscussion.jsx, forum.routes.js

---

#### Feature 4: Password Reset Workflow

**Why I chose this feature:**  
In any production system, users forget passwords. Without a self-service reset mechanism, they have to contact admins, which creates unnecessary support burden. A proper password reset workflow following industry security standards is essential for user autonomy.

**How I approached the design:**
- Email-based verification using OTPs instead of SMS because email is free, works internationally, and doesn't require telecom API integration
- Time-limited tokens with 15-minute expiry windows that balance security (prevents token reuse) with usability (enough time to check email and complete the process)
- Single-use tokens that get invalidated immediately after successful reset to prevent replay attacks

**Implementation details:**
- POST `/auth/request-password-reset` generates a random 6-digit numeric OTP and stores it in the PasswordResetRequest collection with an expiry timestamp
- Nodemailer sends an HTML email with the OTP and a countdown timer showing the 15-minute window
- POST `/auth/reset-password` validates the OTP, checks if it's still within the expiry window, and updates the password using bcrypt hashing
- Admin dashboard at `/admin/password-reset-history` provides a complete audit trail with role-based filtering
- Frontend implements a two-step form: first collect email, then show OTP input field with new password confirmation
- Client-side validation includes password strength indicators and confirmation matching before submission
- Admin interface includes role-based filters, date range selection, and status tracking for all reset requests
- Organizers can view their personal reset history with timestamps

**Technical decisions I made:**
- Stored passwords with bcrypt using 10 salt rounds following OWASP security recommendations
- Used MongoDB TTL indexes on the `expiresAt` field so expired tokens get automatically cleaned up without manual intervention
- Implemented rate limiting of 3 requests per hour per email address to prevent brute force attacks
- Chose 6-digit numeric OTPs over UUID tokens because they're easier to read and type on mobile email clients

**Implementation files:** PasswordResetManagement.jsx, auth.js

---

### Tier C Feature

#### Feature 5: Anonymous Feedback System

**Why I chose this feature:**  
Honest feedback is crucial for improving events, but people often hesitate to provide candid reviews if they think organizers will know who said what. Anonymity removes that fear and encourages more truthful responses that can actually help make future events better.

**How I approached the design:**
- Restricted feedback to participants with status "registered" to ensure only people who actually attended can leave reviews
- Combined quantitative ratings (1-5 stars) with qualitative comments to get both measurable metrics and detailed insights
- Guaranteed anonymity by explicitly excluding the participantId field from all organizer API responses using `.select("-participantId -__v")`

**Implementation details:**
- POST `/events/:eventId/feedback` validates that ratings are between 1-5 and comments are within length limits
- Unique compound index on `{eventId, participantId}` prevents duplicate submissions - each participant can only submit one feedback per event
- GET `/events/:eventId/feedback/stats` uses MongoDB aggregation to calculate total feedback count, average rating, and distribution across 1-5 stars
- Filter support via `?rating=5` query parameter lets organizers view specific star ratings
- Frontend feedback modal has interactive star rating with hover effects and real-time visual selection
- Character counter shows current position out of 1000 character maximum with live updates
- EventFeedback.jsx displays aggregated stats with a large average rating card, star visualization, and horizontal bar graph showing rating distribution
- Filter buttons for All, 5-star, 4-star, 3-star, 2-star, and 1-star feedback
- Individual feedback cards show only timestamps and comments without any author identification

**Technical decisions I made:**
- Used MongoDB aggregation pipeline for calculating averages instead of fetching all records and computing client-side, which is much more efficient
- Stored rating distribution as an object like `{1: count, 2: count, ...}` for O(1) lookup performance
- Chose modal pattern over a separate page for feedback submission because it provides better user experience without navigation disruption

**Implementation files:** FeedbackModal.jsx, EventFeedback.jsx, feedback.routes.js

---

## Setup and Installation

### Prerequisites

- **Node.js** (v18.x or higher)
- **MongoDB** (v6.x or higher) - Running locally or cloud instance (MongoDB Atlas)
- **npm** or **yarn** package manager
- **Git** for version control

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd felicity/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/felicity
   # Or use MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/felicity

   # JWT Secret (use a strong random string)
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

   # Email Configuration (Gmail Example)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   # For Gmail: Enable 2FA and generate App Password at https://myaccount.google.com/apppasswords

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Discord Webhook (Optional - for forum notifications)
   DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

5. **Verify installation:**
   Navigate to `http://localhost:5000` - you should see the API documentation page.

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

5. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`

### Database Initialization

The application will automatically create collections on first use. For testing with pre-populated data:

1. **Create default admin account:**
   - Run the backend server
   - The default admin is created automatically:
     - **Email:** admin@felicity.com
     - **Password:** admin123
     - **Role:** admin

2. **Create test organizer:**
   - Login as admin at `/admin/dashboard`
   - Navigate to "Create Organizer"
   - Fill in organizer details

3. **Import sample data (optional):**
   ```bash
   cd backend
   node src/data/seedData.js  # If seed script exists
   ```

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview  # Preview production build locally
```

The build output will be in `frontend/dist/` and can be deployed to:
- **Vercel** (recommended for Vite apps)
- **Netlify**
- **AWS S3 + CloudFront**
- **Nginx** static file server

### Common Issues & Troubleshooting

**1. MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
```bash
# For local MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**2. Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill the process or change port in `.env`:
```bash
lsof -ti:5000 | xargs kill -9
```

**3. Email Sending Fails:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution:** For Gmail, enable 2FA and use App Password instead of regular password.

**4. CORS Errors in Browser:**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL exactly.

**5. QR Scanner Not Working:**
- **Grant camera permissions** in browser settings
- **Use HTTPS** in production (camera access requires secure context)
- Ensure good lighting and stable camera position

---


## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/request-password-reset` | Initiate password reset | Public |
| POST | `/auth/reset-password` | Complete password reset with OTP | Public |

### Event Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/events` | List all events | Public |
| GET | `/events/:id` | Get event details | Public |
| POST | `/organizer/events` | Create event | Organizer |
| PATCH | `/organizer/events/:id` | Update event | Organizer |
| DELETE | `/organizer/events/:id` | Delete event | Organizer |

### Registration Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/participant/register` | Register for event/merchandise | Participant |
| GET | `/participant/dashboard` | Get user registrations | Participant |
| GET | `/organizer/events/:id/registrations` | View event registrations | Organizer |
| PATCH | `/organizer/registrations/:id/approve` | Approve merchandise payment | Organizer |

### Attendance Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/organizer/events/:id/attendance` | Get attendance stats | Organizer |
| PATCH | `/organizer/events/:id/attendance/:ticketId` | Mark attendance via QR | Organizer |

### Forum Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/events/:id/forum` | Get forum messages | Registered users |
| POST | `/events/:id/forum` | Post message | Registered users |
| DELETE | `/events/:id/forum/:messageId` | Delete message | Organizer |

### Feedback Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/events/:id/feedback` | Submit anonymous feedback | Participant |
| GET | `/events/:id/feedback` | View feedback (anonymous) | Organizer |
| GET | `/events/:id/feedback/stats` | Get aggregated stats | Organizer |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/admin/organizers` | Create organizer account | Admin |
| GET | `/admin/password-reset-history` | View reset history | Admin |

---

## Key Design Decisions Summary

1. **JWT over Sessions:** Stateless authentication enables horizontal scaling and mobile app integration
2. **Tailwind + DaisyUI:** Utility-first CSS with pre-built components balances flexibility and speed
3. **Polling over WebSockets:** Simpler infrastructure for notifications without compromising UX
4. **Disk Storage over Cloud:** Eliminates third-party dependencies and costs for MVP
5. **Email OTP over SMS:** International compatibility and zero API costs
6. **React Router over Next.js:** Client-side routing sufficient for SPA without SSR complexity
7. **MongoDB over SQL:** Flexible schema ideal for varying event types and rapid iteration
8. **Vite over Create React App:** 10-20x faster builds and modern ESM-based architecture

---

## License

This project is developed as part of an academic assignment for educational purposes.

---

## Contributors

- **Developer:** [Your Name]
- **Course:** DASS Assignment
- **Institution:** [Your Institution]
- **Date:** February 2026

---

## Support

For issues or questions:
1. Review common issues in the Setup section
2. Check browser console and backend logs for error messages
3. Ensure all environment variables are correctly configured

---

**Built using React, Node.js, Express, MongoDB, and Tailwind CSS**
