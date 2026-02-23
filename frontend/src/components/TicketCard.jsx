import { useState } from "react";
import FeedbackModal from "./FeedbackModal";

function TicketCard({ registration }) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const getStatusColor = (status) => {
    const colors = {
      registered: "badge-success",
      cancelled: "badge-error",
      rejected: "badge-error",
      waitlisted: "badge-warning"
    };
    return colors[status] || "badge-info";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      completed: "badge-success",
      pending: "badge-warning",
      failed: "badge-error",
      refunded: "badge-info"
    };
    return colors[status] || "badge-ghost";
  };

  const getApprovalStatusColor = (status) => {
    const colors = {
      approved: "badge-success",
      pending: "badge-warning",
      rejected: "badge-error"
    };
    return colors[status] || "badge-ghost";
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="card-title text-lg">{registration.eventId?.eventName}</h3>
            <p className="text-xs opacity-60 mt-1">
              <span className="badge badge-sm badge-outline mr-2">
                {registration.registrationType || registration.eventId?.eventType}
              </span>
              by {registration.eventId?.organizerId?.organizerName || "Unknown Organizer"}
            </p>
            <button 
              className="text-sm font-mono text-primary hover:underline mt-1 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(registration.ticketId);
                alert("Ticket ID copied to clipboard!");
              }}
              title="Click to copy Ticket ID"
            >
              🎫 {registration.ticketId}
            </button>
            {registration.teamName && (
              <p className="text-xs opacity-70 mt-1">
                Team: <span className="font-semibold">{registration.teamName}</span>
              </p>
            )}
          </div>
          <div className={`badge ${getStatusColor(registration.registrationStatus)}`}>
            {registration.registrationStatus}
          </div>
        </div>

        <div className="divider my-2"></div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="opacity-60">Event Date</p>
            <p className="font-semibold">{formatDate(registration.eventId?.eventStartDate)}</p>
          </div>
          <div>
            <p className="opacity-60">Venue</p>
            <p className="font-semibold">{registration.eventId?.venue || "TBA"}</p>
          </div>
          <div>
            <p className="opacity-60">Payment</p>
            <div className={`badge ${getPaymentStatusColor(registration.paymentStatus)}`}>
              {registration.paymentStatus}
            </div>
          </div>
          <div>
            <p className="opacity-60">Amount</p>
            <p className="font-semibold">₹{registration.paymentAmount || 0}</p>
          </div>
        </div>

        {registration.qrCode && (
          <div className="mt-4">
            <button 
              className="btn btn-primary btn-sm w-full"
              onClick={() => document.getElementById(`qr-modal-${registration._id}`).showModal()}
            >
              🎫 Show QR Code
            </button>
          </div>
        )}

        {!registration.qrCode && (
          <div className="alert alert-warning mt-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>QR code not available</span>
          </div>
        )}

        {registration.attended && (
          <div className="alert alert-success mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Attendance Marked</span>
          </div>
        )}

        {/* Feedback Button for registered participants */}
        {registration.registrationStatus === "registered" && (
          <div className="mt-4">
            <button
              className="btn btn-outline btn-sm w-full"
              onClick={() => setShowFeedbackModal(true)}
            >
              ⭐ Give Feedback
            </button>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          eventId={registration.eventId?._id}
          eventName={registration.eventId?.eventName}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            // Optionally refresh the dashboard or show a success message
          }}
        />
      )}

      {/* QR Code Modal */}
      <dialog id={`qr-modal-${registration._id}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Your Event Ticket</h3>
          <div className="flex flex-col items-center">
            <img src={registration.qrCode} alt="QR Code" className="w-64 h-64" />
            <p className="mt-4 text-center font-mono text-sm">{registration.ticketId}</p>
            <p className="text-xs opacity-60 mt-2 text-center">Show this QR code at the venue</p>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default TicketCard;
