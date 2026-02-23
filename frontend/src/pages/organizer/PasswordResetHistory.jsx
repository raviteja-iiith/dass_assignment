import { useState, useEffect } from "react";
import API from "../../services/api";

const PasswordResetHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await API.get("/organizer/password-reset-history");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Please provide a reason");
      return;
    }

    try {
      setSubmitting(true);
      await API.post("/organizer/request-password-reset", { reason });
      alert("Password reset request submitted successfully!");
      setShowRequestModal(false);
      setReason("");
      fetchHistory();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-error"
    };
    return badges[status] || "badge-ghost";
  };

  const hasPendingRequest = requests.some(r => r.status === "pending");

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Password Reset Requests</h2>
        <button
          onClick={() => setShowRequestModal(true)}
          className="btn btn-primary"
          disabled={hasPendingRequest}
        >
          {hasPendingRequest ? "Pending Request Exists" : "Request Password Reset"}
        </button>
      </div>

      {hasPendingRequest && (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>You have a pending password reset request. Please wait for admin approval.</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Date Requested</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Admin Comment</th>
              <th>Processed Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 opacity-60">
                  No password reset requests yet
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id}>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td className="max-w-xs">
                    <p className="truncate">{request.reason}</p>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    {request.adminComment ? (
                      <p className="truncate">{request.adminComment}</p>
                    ) : (
                      <span className="opacity-60">-</span>
                    )}
                  </td>
                  <td>
                    {request.processedAt ? (
                      new Date(request.processedAt).toLocaleString()
                    ) : (
                      <span className="opacity-60">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Request Password Reset</h3>
            <form onSubmit={handleSubmitRequest}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Reason for password reset *</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="textarea textarea-bordered h-24"
                  placeholder="Please provide a valid reason for requesting a password reset..."
                  required
                  maxLength={500}
                ></textarea>
                <label className="label">
                  <span className="label-text-alt">{reason.length}/500 characters</span>
                </label>
              </div>
              <div className="alert alert-warning mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">Your request will be reviewed by an admin. You will receive a new password via email once approved.</span>
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setReason("");
                  }}
                  className="btn"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetHistory;
