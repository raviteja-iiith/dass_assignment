import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    participantType: "IIIT",
    collegeName: "",
    contactNumber: "",
    areasOfInterest: []
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const interestOptions = [
    "Technical", "Cultural", "Sports", "Music", "Dance", 
    "Drama", "Art", "Gaming", "Workshop", "Competition"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(interest)
        ? prev.areasOfInterest.filter(i => i !== interest)
        : [...prev.areasOfInterest, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.participantType === "IIIT" && !formData.email.includes("iiit.ac.in")) {
      setError("IIIT participants must use IIIT email");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...dataToSubmit } = formData;
      await register(dataToSubmit);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 py-12" data-theme="forest" style={{background: 'linear-gradient(180deg, #0a0e0a 0%, #0f1910 50%, #1a2820 100%)'}}>
      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-sm opacity-70">Join Felicity Events</p>
            </div>

            {error && (
              <div className="alert alert-error shadow-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">First Name *</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    className="input input-bordered focus:input-primary"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Last Name</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    className="input input-bordered focus:input-primary"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Participant Type *</span>
                </label>
                <select
                  name="participantType"
                  className="select select-bordered focus:select-primary"
                  value={formData.participantType}
                  onChange={handleChange}
                  required
                >
                  <option value="IIIT">IIIT Student</option>
                  <option value="Non-IIIT">Non-IIIT</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email *</span>
                  {formData.participantType === "IIIT" && (
                    <span className="label-text-alt text-warning">Must be IIIT email</span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@iiit.ac.in"
                  className="input input-bordered focus:input-primary"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Password *</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="input input-bordered focus:input-primary"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Confirm Password *</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="input input-bordered focus:input-primary"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">College Name</span>
                  </label>
                  <input
                    type="text"
                    name="collegeName"
                    placeholder="Your College"
                    className="input input-bordered focus:input-primary"
                    value={formData.collegeName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Contact Number</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    placeholder="+91 1234567890"
                    className="input input-bordered focus:input-primary"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Areas of Interest</span>
                  <span className="label-text-alt opacity-60">Optional - can be set later in Profile</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`badge badge-lg cursor-pointer transition-all hover:scale-105 ${
                        formData.areasOfInterest.includes(interest) 
                          ? "badge-primary" 
                          : "badge-outline"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <label className="label">
                  <span className="label-text-alt text-info">
                    💡 Select interests to get personalized event recommendations
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full mt-6 ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <div className="divider">OR</div>

            <div className="text-center">
              <p className="text-sm">
                Already have an account?{" "}
                <Link to="/login" className="link link-primary font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
