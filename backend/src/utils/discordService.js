const axios = require("axios");

// Post new event to Discord
const postEventToDiscord = async (webhookUrl, eventData) => {
  if (!webhookUrl) return false;

  const embed = {
    title: ` New Event: ${eventData.eventName}`,
    description: eventData.eventDescription.substring(0, 300) + (eventData.eventDescription.length > 300 ? "..." : ""),
    color: 0x5865F2, // Discord blue
    fields: [
      {
        name: "Event Type",
        value: eventData.eventType.charAt(0).toUpperCase() + eventData.eventType.slice(1),
        inline: true
      },
      {
        name: "Registration Fee",
        value: eventData.registrationFee > 0 ? `₹${eventData.registrationFee}` : "Free",
        inline: true
      },
      {
        name: "Start Date",
        value: new Date(eventData.eventStartDate).toLocaleDateString(),
        inline: true
      },
      {
        name: "Registration Deadline",
        value: new Date(eventData.registrationDeadline).toLocaleDateString(),
        inline: true
      },
      {
        name: "Eligibility",
        value: eventData.eligibility,
        inline: true
      },
      {
        name: "Spots Available",
        value: eventData.registrationLimit > 0 ? eventData.registrationLimit.toString() : "Unlimited",
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Felicity Event Management System"
    }
  };

  if (eventData.eventTags && eventData.eventTags.length > 0) {
    embed.fields.push({
      name: "Tags",
      value: eventData.eventTags.join(", "),
      inline: false
    });
  }

  try {
    await axios.post(webhookUrl, {
      embeds: [embed]
    });
    return true;
  } catch (error) {
    console.error("Discord webhook error:", error.message);
    return false;
  }
};

module.exports = {
  postEventToDiscord
};
