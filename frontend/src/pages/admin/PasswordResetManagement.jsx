import { useState, useEffect } from "react";
import API from "../../services/api";

const PasswordResetManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get("/admin/password-reset-requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      alert("Failed to fetch password reset requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await API.put(
        `/admin/password-reset-requests/${selectedRequest._id}/approve`,
        { adminComment }
      );
      setGeneratedPassword(response.data.newPassword);
      alert("Password reset approved successfully!");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.error || "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!adminComment.trim()) {
      alert("Please provide a comment");
      return;
    }

    try {
      setProcessing(true);
      await API.put(
        `/admin/password-reset-requests/${selectedRequest._id}/reject`,
        { adminComment }
      );
      alert("Password reset request rejected");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminComment("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.error || "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  const handleClearPassword = async (requestId) => {
    try {
      await API.put(`/admin/password-reset-requests/${requestId}/clear-temp-password`);
      setGeneratedPassword(null);
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminComment("");
    } catch (error) {
      console.error("Error clearing password:", error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Password copied to clipboard!");
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-error"
    };
    return badges[status] || "badge-ghost";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Password Reset Management</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`btn ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`btn ${filter === "pending" ? "btn-warning" : "btn-ghost"}`}
        >
          Pending ({requests.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`btn ${filter === "approved" ? "btn-success" : "btn-ghost"}`}
        >
          Approved ({requests.filter((r) => r.status === "approved").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`btn ${filter === "rejected" ? "btn-error" : "btn-ghost"}`}
        >
          Rejected ({requests.filter((r) => r.status === "rejected").length})
        </button>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Organizer</th>
              <th>Category</th>
              <th>Contact Email</th>
              <th>Reason</th>
              <th>Requested Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 opacity-60">
                  No requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div className="font-bold">{request.organizerId?.organizerName}</div>
                    <div className="text-sm opacity-50">{request.organizerId?.email}</div>
                  </td>
                  <td>{request.organizerId?.category || "-"}</td>
                  <td>{request.organizerId?.contactEmail || "-"}</td>
                  <td className="max-w-xs">
                    <p className="line-clamp-2">{request.reason}</p>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApproveModal(true);
                          }}
                          className="btn btn-success btn-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="btn btn-error btn-sm"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" disabled>
                        {request.status}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Approve Password Reset Request</h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <div>
                  <p><strong>Organizer:</strong> {selectedRequest.organizerId?.organizerName}</p>
                  <p><strong>Email:</strong> {selectedRequest.organizerId?.email}</p>
                  <p><strong>Contact:</strong> {selectedRequest.organizerId?.contactEmail}</p>
                  <p className="mt-2"><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>
              </div>

              {!generatedPassword ? (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Admin Comment (Optional)</span>
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="textarea textarea-bordered"
                      placeholder="Add any comments..."
                      maxLength={500}
                    ></textarea>
                  </div>

                  <div className="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>A new password will be auto-generated and sent to the organizer's contact email.</span>
                  </div>
                </>
              ) : (
                <div className="alert alert-success">
                  <div className="w-full">
                    <p className="font-bold mb-2">Password Generated Successfully!</p>
                    <div className="bg-base-100 p-4 rounded mt-2">
                      <p className="text-sm opacity-60 mb-1">New Password:</p>
                      <div className="flex gap-2 items-center">
                        <code className="text-lg font-mono flex-1">{generatedPassword}</code>
                        <button
                          onClick={() => copyToClipboard(generatedPassword)}
                          className="btn btn-sm btn-primary"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mt-4 opacity-80">
                      Please share this password with the organizer. The password has also been sent to their email.
                    </p>
                    <p className="text-sm mt-2 text-warning">
                      ⚠️ Make sure to copy the password before closing this dialog!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              {!generatedPassword ? (
                <>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                      setAdminComment("");
                    }}
                    className="btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn btn-success"
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Approve & Generate Password"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClearPassword(selectedRequest._id)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Reject Password Reset Request</h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <div>
                  <p><strong>Organizer:</strong> {selectedRequest.organizerId?.organizerName}</p>
                  <p className="mt-2"><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rejection Comment *</span>
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="textarea textarea-bordered"
                  placeholder="Provide a reason for rejection..."
                  required
                  maxLength={500}
                ></textarea>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setAdminComment("");
                }}
                className="btn"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="btn btn-error"
                disabled={processing || !adminComment.trim()}
              >
                {processing ? "Processing..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetManagement;
