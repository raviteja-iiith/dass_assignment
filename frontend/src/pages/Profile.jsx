import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [organizers, setOrganizers] = useState([]);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const interestOptions = [
    "Technical", "Cultural", "Sports", "Music", "Dance", 
    "Drama", "Art", "Gaming", "Workshop", "Competition"
  ];

  useEffect(() => {
    fetchProfile();
    if (user.role === "participant") {
      fetchOrganizers();
    }
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

  const fetchOrganizers = async () => {
    try {
      const { data } = await API.get("/participant/organizers");
      setOrganizers(data);
    } catch (error) {
      console.error("Failed to fetch organizers:", error);
    }
  };

  const toggleInterest = (interest) => {
    const currentInterests = formData.areasOfInterest || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    setFormData({ ...formData, areasOfInterest: newInterests });
  };

  const toggleFollowOrganizer = async (organizerId) => {
    try {
      await API.post(`/participant/follow/${organizerId}`);
      fetchProfile(); // Refresh to get updated followed list
    } catch (error) {
      alert("Failed to update organizer follow status");
    }
  };

  const isFollowing = (organizerId) => {
    return profile?.followedOrganizers?.some(org => 
      (org._id || org).toString() === organizerId.toString()
    );
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

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    try {
      const endpoint = user.role === "participant" 
        ? "/participant/change-password" 
        : "/organizer/change-password";
      
      await API.put(endpoint, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      alert("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      alert(error.response?.data?.error || "Failed to change password");
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
                  {editing ? (
                    <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg">
                      {interestOptions.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`badge badge-lg cursor-pointer transition-all hover:scale-105 ${
                            (formData.areasOfInterest || []).includes(interest)
                              ? "badge-primary"
                              : "badge-outline"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg">
                      {profile.areasOfInterest?.length > 0 ? (
                        profile.areasOfInterest.map((interest, idx) => (
                          <div key={idx} className="badge badge-primary badge-lg">{interest}</div>
                        ))
                      ) : (
                        <p className="text-sm opacity-60">No interests selected</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Followed Organizers Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Followed Organizers</span>
                    <button 
                      onClick={() => setShowOrganizerModal(true)}
                      className="btn btn-sm btn-primary"
                    >
                      Manage Follows
                    </button>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg">
                    {profile.followedOrganizers?.length > 0 ? (
                      profile.followedOrganizers.map((org, idx) => (
                        <div key={idx} className="badge badge-secondary badge-lg">
                          {org.organizerName || "Organizer"}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm opacity-60">Not following any organizers yet</p>
                    )}
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
                    <span className="label-text font-semibold">Login Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={profile.email}
                    disabled
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Organizer Follow Modal */}
      {user.role === "participant" && showOrganizerModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Manage Followed Organizers</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {organizers.map(org => (
                <div key={org._id} className="flex items-center justify-between p-3 border border-base-300 rounded-lg hover:bg-base-200">
                  <div>
                    <h4 className="font-semibold">{org.organizerName}</h4>
                    <p className="text-sm opacity-70">{org.category}</p>
                    <p className="text-xs opacity-60 mt-1">{org.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFollowOrganizer(org._id)}
                    className={`btn btn-sm ${
                      isFollowing(org._id) ? "btn-error" : "btn-primary"
                    }`}
                  >
                    {isFollowing(org._id) ? "Unfollow" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
        

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Change Password</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Current Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={handleChangePassword} className="btn btn-primary">
                Change Password
              </button>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }} 
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}    <div className="modal-action">
              <button onClick={() => setShowOrganizerModal(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;