import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    organizerName: "",
    category: "",
    description: "",
    contactEmail: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashData, orgData] = await Promise.all([
        API.get("/admin/dashboard"),
        API.get("/admin/organizers")
      ]);
      setDashboard(dashData.data);
      setOrganizers(orgData.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createOrganizer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/admin/organizers", formData);
      alert(`Organizer created! Credentials:\nEmail: ${data.organizer.email}\nPassword: ${data.organizer.tempPassword}`);
      setShowCreateForm(false);
      setFormData({ organizerName: "", category: "", description: "", contactEmail: "" });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create organizer");
    }
  };

  const toggleOrganizer = async (id, isApproved) => {
    try {
      if (isApproved) {
        await API.delete(`/admin/organizers/${id}`);
        alert("Organizer disabled");
      } else {
        await API.put(`/admin/organizers/${id}/enable`);
        alert("Organizer enabled");
      }
      fetchData();
    } catch (error) {
      alert("Failed to toggle organizer status");
    }
  };

  const resetPassword = async (id) => {
    try {
      const { data } = await API.post(`/admin/reset-password/${id}`);
      alert(`Password reset! New password: ${data.newPassword}`);
      fetchData();
    } catch (error) {
      alert("Failed to reset password");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-lg opacity-70">System Management & Analytics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/password-resets" className="btn btn-secondary">
            🔑 Password Reset Requests
          </Link>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
            {showCreateForm ? "Cancel" : "+ Create Organizer"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stats shadow border border-base-300 hover:shadow-2xl hover:shadow-success/50 hover:border-success transition-all duration-300 cursor-pointer">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Organizers</div>
            <div className="stat-value text-primary">{dashboard?.totalOrganizers || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-2xl hover:shadow-success/50 hover:border-success transition-all duration-300 cursor-pointer">
          <div className="stat">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Approved Organizers</div>
            <div className="stat-value text-success">{dashboard?.approvedOrganizers || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-2xl hover:shadow-success/50 hover:border-success transition-all duration-300 cursor-pointer">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Participants</div>
            <div className="stat-value text-secondary">{dashboard?.totalParticipants || 0}</div>
          </div>
        </div>

        <div className="stats shadow border border-base-300 hover:shadow-2xl hover:shadow-success/50 hover:border-success transition-all duration-300 cursor-pointer">
          <div className="stat">
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="stat-title">Password Resets</div>
            <div className="stat-value text-warning">{dashboard?.pendingPasswordResets || 0}</div>
          </div>
        </div>
      </div>

      {/* Create Organizer Form */}
      {showCreateForm && (
        <div className="card bg-base-100 shadow-xl border border-base-300 mb-8">
          <div className="card-body">
            <h2 className="card-title">Create New Organizer</h2>
            <form onSubmit={createOrganizer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Organizer Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="E-Cell"
                    className="input input-bordered"
                    value={formData.organizerName}
                    onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Category *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Technical"
                    className="input input-bordered"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  placeholder="About the organizer..."
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Contact Email *</span>
                </label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  className="input input-bordered"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Organizer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Organizers Table */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title mb-4">Manage Organizers</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map(org => (
                  <tr key={org._id} className="hover">
                    <td className="font-semibold">{org.organizerName}</td>
                    <td className="font-mono text-sm">{org.email}</td>
                    <td>
                      <div className="badge badge-outline">{org.category}</div>
                    </td>
                    <td>{org.contactEmail}</td>
                    <td>
                      <div className={`badge ${org.isApproved ? "badge-success" : "badge-error"}`}>
                        {org.isApproved ? "Active" : "Disabled"}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleOrganizer(org._id, org.isApproved)}
                          className={`btn btn-xs ${org.isApproved ? "btn-error" : "btn-success"}`}
                        >
                          {org.isApproved ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => resetPassword(org._id)}
                          className="btn btn-xs btn-warning"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
