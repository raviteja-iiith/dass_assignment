# Felicity Event Management - Feature Testing Guide

## 🎯 Testing Advanced Features (Tier A - 8 Marks Each)

### Feature 2: Merchandise Payment Approval Workflow

**Prerequisites:**
- Have at least one merchandise event created (e.g., "cloth store")
- Know the organizer credentials who created the merchandise event

**Test Steps:**

1. **Login as Participant**
   - URL: `http://localhost:5173/login`
   - Use any participant account

2. **Browse and Find Merchandise Event**
   - Click "Browse Events" in navbar
   - Find a merchandise event (shows "merchandise" tag)
   - Click on the event card

3. **Purchase Merchandise**
   - Scroll to merchandise section
   - Select variant (size/color)
   - Select quantity
   - **Upload payment proof image** (JPEG, PNG, GIF, WEBP)
   - Click "Purchase Now"
   - ✅ Should show success message: "Payment proof uploaded successfully! Your order is pending organizer approval."

4. **Verify Pending Status**
   - Go to Participant Dashboard
   - Find merchandise event in "Merchandise" tab
   - ✅ Should show:
     - Payment: "pending" (yellow badge)
     - "⚠️ QR code not available" message
     - No email received yet

5. **Login as Organizer**
   - Logout from participant
   - Login with organizer credentials (who created the merchandise event)

6. **Approve Payment**
   - Go to Organizer Dashboard
   - Click **"📦 Merchandise Orders"** button (top-right)
   - ✅ Should see list of orders with:
     - Participant name and email
     - Payment amount
     - Upload date
     - Status badges (Pending/Approved/Rejected)
   - Click **"View Image"** to see the payment proof
   - Review the payment proof image
   - Click **"Approve"** button

7. **Verify Approval**
   - ✅ Success message should appear
   - Status should change to "approved" (green badge)
   - Approve/Reject buttons should disappear
   - **Check email** (participant's email) for confirmation with QR code

8. **Login Back as Participant**
   - Logout and login as participant again
   - Go to Dashboard → Merchandise tab
   - ✅ Should now show:
     - Payment: "completed" (green badge)
     - "Show QR Code" button available
     - Click button to see QR code

**Expected Behavior:**
- ✅ Payment proof required before purchase
- ✅ Order enters "pending" state
- ✅ Organizer can view payment proof image
- ✅ Approve/Reject actions available
- ✅ On approval: QR generated, email sent, status updated
- ✅ Stock decremented only after approval

---

### Feature 3: QR Scanner & Attendance Tracking

**Prerequisites:**
- Have an event with registrations
- Login as organizer of that event

**Test Steps:**

1. **Access QR Scanner**
   - Login as organizer
   - Go to Organizer Dashboard
   - Find your event card
   - Click **"Scanner"** button

2. **View Attendance Dashboard**
   - ✅ Should see 4 stat cards:
     - Total Registrations
     - Attended
     - Not Yet Attended
     - Attendance Rate (%)

3. **Test Camera QR Scanning**
   - Click **"Start Scanner"** button
   - Camera should activate (grant permissions if asked)
   - Use participant's QR code (from email or dashboard)
   - Point camera at QR code
   - ✅ Should show success message with participant name
   - ✅ Stats should update immediately
   - ✅ Attendance list should show "Attended" badge

4. **Test Duplicate Scan Prevention**
   - Try scanning the same QR code again
   - ✅ Should show error: "Duplicate scan detected - Already scanned at [timestamp]"

5. **Test Manual Ticket Entry**
   - Scroll to "Manual Ticket Entry" section
   - Enter a ticket ID (e.g., "FEL-MLCZEK63-LURQS3")
   - Click "Scan" or press Enter
   - ✅ Should mark attendance with same success flow

6. **Test Manual Override**
   - Find a participant who hasn't attended yet
   - Click "Manual Override" button
   - Enter reason (e.g., "QR code not working")
   - Click "Confirm"
   - ✅ Should mark attendance with "Manual" badge
   - ✅ Reason should be logged in audit trail

7. **Test CSV Export**
   - Click **"Export CSV"** button
   - ✅ File should download: `attendance_[EventName]_[timestamp].csv`
   - Open file to verify columns:
     - Ticket ID, Name, Email, Contact, Attended, Time, Manual Override, Reason

8. **Verify Attendance List Table**
   - ✅ Should show all registrations
   - ✅ Color coding: Green background for attended, white for not attended
   - ✅ Columns: Ticket ID, Name, Email, Status, Time, Actions
   - ✅ Manual Override badge visible if applicable

**Expected Behavior:**
- ✅ Camera-based QR scanning works
- ✅ Manual ticket entry works
- ✅ Duplicate scans rejected with error
- ✅ Live stats update immediately
- ✅ Manual override with reason tracking
- ✅ CSV export with all data
- ✅ Audit logging for all actions

---

## 🎯 Testing Tier B Features (6 Marks Each)

### Feature 1: Real-Time Discussion Forum

**Prerequisites:**
- Have an event with at least one registration
- Know participant and organizer credentials

**Test Steps:**

1. **Access Forum (as Participant)**
   - Login as participant
   - Navigate to event you're registered for
   - Click "Event Details"
   - Click **"💬 Discussion Forum"** tab
   - ✅ Should see forum interface

2. **Post a Message**
   - Enter text in the message box
   - Click "Post"
   - ✅ Message should appear immediately
   - ✅ Shows your name and timestamp

3. **Test Message Threading (Replies)**
   - Find any message
   - Click **"💬 Reply"** button
   - Enter reply text
   - Click "Reply"
   - ✅ Reply should be nested under original message
   - ✅ Original message should show "▶ 1 reply" button
   - Click to expand/collapse thread

4. **Test Reactions**
   - Click reaction buttons on any message:
     - 👍 (like)
     - ❤️ (heart)
     - 👏 (thumbsup)
     - ❓ (question)
   - ✅ Reaction count should increase
   - ✅ Button should highlight when you react
   - ✅ Click again to remove your reaction

5. **Test Real-Time Updates**
   - Open forum in another browser/tab with different account
   - Post a message from the other account
   - Wait ~5 seconds
   - ✅ **NEW MESSAGE NOTIFICATION** should appear:
     - Toast notification at top: "New messages in the forum! 🎉"
     - Alert banner: "[N] new messages since your last visit"
     - New messages have:
       - 🆕 NEW badge (green, bouncing)
       - Green border
       - Slight animation

6. **Mark Messages as Read**
   - Click **"Mark All as Read"** button
   - ✅ NEW badges should disappear
   - ✅ Notification banner should hide
   - ✅ Timestamp saved in localStorage

7. **Test Organizer Moderation**
   - Login as organizer of the event
   - Go to same event → Discussion Forum tab
   - ✅ Should see "⋮" menu on each message

8. **Pin Messages (Organizer)**
   - Click "⋮" on any message
   - Click "Pin"
   - ✅ Message should move to top
   - ✅ Shows "📌 Pinned" badge
   - ✅ Has blue border
   - Click "Unpin" to remove

9. **Delete Messages (Organizer)**
   - Click "⋮" on any message
   - Click "Delete"
   - Confirm deletion
   - ✅ Message should disappear (soft delete)

10. **Post Announcements (Organizer)**
    - As organizer, write a message
    - Check **"Post as Announcement"** checkbox
    - Click "Post"
    - ✅ Message has special styling (accent background)
    - ✅ Shows "📢 Announcement" badge
    - ✅ Stands out visually

**Expected Behavior:**
- ✅ Registered participants can post messages
- ✅ Organizers can moderate (delete/pin)
- ✅ Message threading (replies) works
- ✅ Reactions work with toggle
- ✅ Real-time updates via polling (5s)
- ✅ **Notification system:**
  - Toast notifications for new messages
  - Unread message count badge
  - NEW badges on messages
  - Mark as read functionality
- ✅ Announcements visually distinct

---

### Feature 2: Organizer Password Reset Workflow

**Prerequisites:**
- Have organizer account
- Have admin account

**Test Steps:**

1. **Submit Password Reset Request (Organizer)**
   - Login as organizer
   - Go to Organizer Dashboard
   - Click **"🔑 Password Reset"** button (top-right)
   - ✅ Should see "Password Reset Requests" page with history table

2. **Create New Request**
   - Click **"Request Password Reset"** button
   - Enter reason (e.g., "Forgot password, need access to manage events")
   - Click "Submit"
   - ✅ Success message appears
   - ✅ Button becomes disabled: "Pending Request Exists"
   - ✅ Info alert shows: "You have a pending password reset request"
   - ✅ Request appears in table with:
     - Date Requested
     - Reason
     - Status: "pending" (yellow badge)
     - Admin Comment: "-"

3. **Try Duplicate Request**
   - Try clicking "Request Password Reset" again
   - ✅ Button should be disabled
   - ✅ Cannot submit duplicate requests

4. **View Requests (Admin)**
   - Logout from organizer
   - Login as admin (credentials from initial setup)
   - Click **"Password Reset Requests"** in navbar

5. **Admin Dashboard View**
   - ✅ Should see all password reset requests
   - ✅ Filter tabs:
     - All ([total count])
     - Pending ([count])
     - Approved ([count])
     - Rejected ([count])
   - ✅ Table shows:
     - Organizer name
     - Category (club/society)
     - Contact email
     - Reason
     - Requested date
     - Status badge
     - Action buttons

6. **Approve Request**
   - Find the pending request
   - Click **"Approve"** button
   - ✅ Modal opens showing:
     - Organizer details
     - Contact email
     - Reason
     - Admin comment field (optional)
     - Warning: "A new password will be auto-generated..."
   - Optionally add admin comment
   - Click **"Approve & Generate Password"**

7. **Verify Auto-Generated Password**
   - ✅ Modal should update to show:
     - Success message
     - Generated password in monospace font
     - **Copy** button
   - Click "Copy" to copy password to clipboard
   - ✅ Alert: "Password copied to clipboard!"
   - **Note down the generated password**
   - Click "Close"

8. **Verify Email Sent**
   - Check organizer's contact email
   - ✅ Should receive email with new credentials:
     - Login email
     - New password
     - Instructions

9. **Verify Status Update**
   - Refresh admin page
   - ✅ Request status should be "approved" (green badge)
   - ✅ Action buttons replaced with "approved" disabled button

10. **Test Organizer Login with New Password**
    - Logout from admin
    - Go to login page
    - Login with organizer credentials using:
      - Email: organizer's email
      - Password: **new auto-generated password**
    - ✅ Should login successfully

11. **Verify Organizer History**
    - Go to Organizer Dashboard
    - Click "Password Reset" button
    - ✅ Should see request in history:
      - Status: "approved" (green)
      - Admin comment (if added)
      - Processed date

12. **Test Reject Request**
    - Login as different organizer
    - Submit another password reset request
    - Login as admin
    - Find new request
    - Click **"Reject"** button
    - ✅ Modal opens
    - Enter rejection comment (required): "Please contact support directly"
    - Click "Reject Request"
    - ✅ Status changes to "rejected" (red badge)
    - ✅ Organizer can see rejection in their history

**Expected Behavior:**
- ✅ Organizer can request password reset
- ✅ Admin sees all requests with full details
- ✅ Admin can approve with auto-generated password
- ✅ Admin can reject with comment
- ✅ Password auto-generated securely
- ✅ Email sent with new credentials
- ✅ Status tracking (Pending/Approved/Rejected)
- ✅ Request history visible to organizer
- ✅ Cannot submit duplicate pending requests

---

## 📝 General Testing Tips

### Browser/Tab Setup
- Use 2 different browsers for testing different roles simultaneously:
  - Browser 1: Participant account
  - Browser 2: Organizer/Admin account
- Or use incognito/private windows

### Check Browser Console
- Press F12 to open developer tools
- Check Console tab for any errors (should be none)
- Network tab to verify API calls

### Email Testing
- If email service is configured, check email inbox
- If not configured, check backend console logs for email content

### Data Verification
- Check MongoDB database if needed:
  ```bash
  # Connect to MongoDB
  mongosh
  use felicity
  
  # Check registrations
  db.registrations.find().pretty()
  
  # Check forum messages
  db.forummessages.find().pretty()
  
  # Check password reset requests
  db.passwordresetrequests.find().pretty()
  ```

### Common Issues
- **"Unauthorized" errors**: Token might have expired, logout and login again
- **No QR code showing**: Check payment approval status first
- **Forum not loading**: Ensure you're registered for the event
- **Camera not working**: Grant browser camera permissions

---

## 🎓 Test Accounts (Create if needed)

### Participant Account
```
Email: participant@test.com
Password: Test123!
Role: participant
```

### Organizer Account
```
Email: organizer@test.com
Password: Test123!
Role: organizer
```

### Admin Account
```
Email: admin@test.com
Password: Test123!
Role: admin
```

---

## ✅ Feature Checklist

### Tier A - Advanced Features (16 marks)
- [x] Feature 2: Merchandise Payment Approval Workflow (8 marks)
- [x] Feature 3: QR Scanner & Attendance Tracking (8 marks)

### Tier B - Real-time & Communication (12 marks)
- [x] Feature 1: Real-Time Discussion Forum (6 marks)
- [x] Feature 2: Organizer Password Reset Workflow (6 marks)

**Total Advanced Features Score: 28 marks**

---

## 📹 Recommended Testing Order

1. **Start with basic features** to set up data:
   - Create/publish events
   - Register as participant
   - Create merchandise events

2. **Test Merchandise Workflow** (requires events and registrations)

3. **Test QR Scanner** (requires registrations to scan)

4. **Test Forum** (requires event access)

5. **Test Password Reset** (standalone feature)

---

## 🐛 Reporting Issues

If you find any bugs during testing:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify your user role and permissions
4. Check if the feature requires specific prerequisites

Good luck with testing! 🚀
