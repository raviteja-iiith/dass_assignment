import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const endpoint = user.role === "participant" ? "/participant/profile" : "/organizer/profile";
      const { data } = await API.get(endpoint);
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const endpoint = user.role === "participant" ? "/participant/profile" : "/organizer/profile";
      await API.put(endpoint, formData);
      alert("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      alert("Failed to update profile");
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
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Profile</h1>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="btn btn-success">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {user.role === "participant" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">First Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!editing}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Last Name</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={formData.lastName || ""}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={profile.email}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Participant Type</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={profile.participantType}
                      disabled
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Contact Number</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered"
                      value={formData.contactNumber || ""}
                      onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">College Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.collegeName || ""}
                    onChange={(e) => setFormData({...formData, collegeName: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Areas of Interest</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg">
                    {profile.areasOfInterest?.map((interest, idx) => (
                      <div key={idx} className="badge badge-primary badge-lg">{interest}</div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Organizer Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.organizerName || ""}
                    onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Category</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Contact Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={formData.contactEmail || ""}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Discord Webhook</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    value={formData.discordWebhook || ""}
                    onChange={(e) => setFormData({...formData, discordWebhook: e.target.value})}
                    disabled={!editing}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;