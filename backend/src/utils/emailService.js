const nodemailer = require("nodemailer");

// Configure email transporter (lazy initialization to avoid startup errors)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

// Send registration confirmation email with ticket
const sendTicketEmail = async (toEmail, participantName, ticketData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Registration Confirmed - ${ticketData.eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Registration Confirmed!</h2>
        <p>Dear ${participantName},</p>
        <p>Your registration for <strong>${ticketData.eventName}</strong> has been confirmed.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
          <p><strong>Event:</strong> ${ticketData.eventName}</p>
          <p><strong>Date:</strong> ${new Date(ticketData.eventDate).toLocaleDateString()}</p>
          <p><strong>Venue:</strong> ${ticketData.venue || "TBA"}</p>
          ${ticketData.amount ? `<p><strong>Amount Paid:</strong> ₹${ticketData.amount}</p>` : ""}
        </div>
        
        ${ticketData.qrCode ? `
          <div style="text-align: center; margin: 20px 0;">
            <p><strong>Your QR Code:</strong></p>
            <img src="${ticketData.qrCode}" alt="QR Code" style="width: 200px; height: 200px;" />
            <p style="font-size: 12px; color: #666;">Show this QR code at the event venue</p>
          </div>
        ` : ""}
        
        <p>Please save this email for your records.</p>
        <p>See you at the event!</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

// Send organizer credentials email
const sendOrganizerCredentials = async (toEmail, organizerName, credentials) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your Organizer Account Credentials - Felicity",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Felicity Organizer Portal!</h2>
        <p>Dear ${organizerName},</p>
        <p>An organizer account has been created for you. Here are your login credentials:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Email:</strong> ${credentials.email}</p>
          <p><strong>Temporary Password:</strong> ${credentials.password}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        <p>Login at: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">
          If you did not expect this email, please contact the administrator.
        </p>
      </div>
    `
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

module.exports = {
  sendTicketEmail,
  sendOrganizerCredentials
};
