import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../../services/api";

const AttendanceScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualTicketId, setManualTicketId] = useState("");
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  useEffect(() => {
    if (scannerActive) {
      const scanner = new Html5QrcodeScanner("qr-reader", {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scanner.render(onScanSuccess, onScanError);

      return () => {
        scanner.clear();
      };
    }
  }, [scannerActive]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/organizer/events/${eventId}/attendance`);
      setEvent(response.data.event);
      setRegistrations(response.data.registrations);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      const ticketId = qrData.ticketId;

      // Mark attendance
      await handleScan(ticketId);
    } catch (error) {
      console.error("Invalid QR code:", error);
      setScanError("Invalid QR code format");
    }
  };

  const onScanError = (error) => {
    // Ignore scan errors - they happen continuously while scanning
  };

  const handleScan = async (ticketId) => {
    try {
      const response = await API.post(`/organizer/events/${eventId}/scan`, {
        ticketId,
      });

      setScanResult({
        type: "success",
        message: response.data.message,
        participant: response.data.participant,
      });
      setScanError(null);

      // Refresh attendance list
      fetchAttendance();

      // Auto-clear success message after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    } catch (error) {
      console.error("Error scanning ticket:", error);
      const errorMsg = error.response?.data?.error || "Failed to scan ticket";
      setScanError(errorMsg);
      setScanResult({
        type: "error",
        message: errorMsg,
      });

      // Auto-clear error message after 5 seconds
      setTimeout(() => {
        setScanError(null);
        setScanResult(null);
      }, 5000);
    }
  };

  const handleManualScan = () => {
    if (!manualTicketId.trim()) {
      alert("Please enter a ticket ID");
      return;
    }
    handleScan(manualTicketId);
    setManualTicketId("");
  };

  const handleManualOverride = async (registrationId, reason) => {
    try {
      await API.post(`/organizer/events/${eventId}/manual-attendance`, {
        registrationId,
        reason,
      });
      alert("Attendance marked manually");
      setShowManualOverride(false);
      setSelectedRegistration(null);
      fetchAttendance();
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert(error.response?.data?.error || "Failed to mark attendance");
    }
  };

  const handleExport = async () => {
    try {
      const response = await API.get(
        `/organizer/events/${eventId}/attendance/export`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_${event?.eventName}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting attendance:", error);
      alert("Failed to export attendance");
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
      <div className="mb-6">
        <button
          onClick={() => navigate("/organizer/dashboard")}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-2">{event?.eventName} - Attendance</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats?.total}</div>
          <div className="text-sm text-gray-600">Total Registrations</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats?.attended}</div>
          <div className="text-sm text-gray-600">Attended</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats?.notAttended}</div>
          <div className="text-sm text-gray-600">Not Yet Attended</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats?.attendanceRate}%</div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </div>
      </div>

      {/* QR Scanner Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>

        <button
          onClick={() => setScannerActive(!scannerActive)}
          className={`px-4 py-2 rounded mb-4 ${
            scannerActive
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {scannerActive ? "Stop Scanner" : "Start Scanner"}
        </button>

        {scannerActive && (
          <div id="qr-reader" className="mb-4"></div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div
            className={`p-4 rounded mb-4 ${
              scanResult.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <div className="font-bold">{scanResult.message}</div>
            {scanResult.participant && (
              <div className="text-sm mt-2">
                {scanResult.participant.firstName} {scanResult.participant.lastName} ({scanResult.participant.email})
              </div>
            )}
          </div>
        )}

        {/* Manual Ticket Entry */}
        <div className="border-t pt-4">
          <h3 className="font-bold mb-2">Manual Ticket Entry</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Enter Ticket ID"
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
            />
            <button
              onClick={handleManualScan}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Scan
            </button>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Attendance List</h2>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ticket ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attendance Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr
                  key={reg._id}
                  className={reg.attended ? "bg-green-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reg.ticketId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.participantId?.firstName} {reg.participantId?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.participantId?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reg.attended ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Attended
                        {reg.manualOverride && " (Manual)"}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Not Yet
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.attendanceMarkedAt
                      ? new Date(reg.attendanceMarkedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!reg.attended && (
                      <button
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setShowManualOverride(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Manual Override
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {showManualOverride && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Manual Attendance Override</h3>
            <p className="mb-4">
              Mark attendance for {selectedRegistration.participantId?.firstName}{" "}
              {selectedRegistration.participantId?.lastName}?
            </p>
            <input
              type="text"
              id="override-reason"
              placeholder="Reason for manual override"
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const reason = document.getElementById("override-reason").value;
                  if (!reason) {
                    alert("Please provide a reason");
                    return;
                  }
                  handleManualOverride(selectedRegistration._id, reason);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowManualOverride(false);
                  setSelectedRegistration(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceScanner;
