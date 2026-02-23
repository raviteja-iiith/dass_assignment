import { useState, useEffect } from "react";
import API from "../../services/api";

const MerchandiseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [selectedImage, setSelectedImage] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.get("/organizer/merchandise-orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!confirm("Are you sure you want to approve this payment?")) return;

    try {
      setProcessingOrderId(orderId);
      await API.put(`/organizer/merchandise-orders/${orderId}/approve`);
      alert("Payment approved successfully! QR code generated and email sent.");
      fetchOrders();
    } catch (error) {
      console.error("Error approving payment:", error);
      alert(error.response?.data?.error || "Failed to approve payment");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    try {
      setProcessingOrderId(orderId);
      await API.put(`/organizer/merchandise-orders/${orderId}/reject`, { reason });
      alert("Payment rejected successfully.");
      fetchOrders();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert(error.response?.data?.error || "Failed to reject payment");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.paymentApprovalStatus === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Merchandise Payment Approvals</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          All ({orders.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded ${
            filter === "pending"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Pending ({orders.filter((o) => o.paymentApprovalStatus === "pending").length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded ${
            filter === "approved"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Approved ({orders.filter((o) => o.paymentApprovalStatus === "approved").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded ${
            filter === "rejected"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Rejected ({orders.filter((o) => o.paymentApprovalStatus === "rejected").length})
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Variant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Proof
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.ticketId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {order.participantId?.firstName} {order.participantId?.lastName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {order.participantId?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.eventId?.merchandiseDetails?.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.merchandisePurchase?.variant?.size && (
                      <div>Size: {order.merchandisePurchase.variant.size}</div>
                    )}
                    {order.merchandisePurchase?.variant?.color && (
                      <div>Color: {order.merchandisePurchase.variant.color}</div>
                    )}
                    <div>Qty: {order.merchandisePurchase?.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.paymentAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.paymentProof ? (
                      <button
                        onClick={() => setSelectedImage(`http://localhost:3000${order.paymentProof}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Image
                      </button>
                    ) : (
                      <span className="text-gray-400">No proof</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.paymentApprovalStatus
                      )}`}
                    >
                      {order.paymentApprovalStatus}
                    </span>
                    {order.paymentRejectionReason && (
                      <div className="text-xs text-red-600 mt-1">
                        {order.paymentRejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.paymentApprovalStatus === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(order._id)}
                          disabled={processingOrderId === order._id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {processingOrderId === order._id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(order._id)}
                          disabled={processingOrderId === order._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {processingOrderId === order._id ? "..." : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        {order.paymentApprovalStatus === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-4 bg-white text-black px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchandiseOrders;
