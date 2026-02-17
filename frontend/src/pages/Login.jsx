import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-theme="forest" style={{background: 'linear-gradient(180deg, #0a0e0a 0%, #0f1910 50%, #1a2820 100%)'}}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{background: 'rgba(34, 197, 94, 0.15)'}}></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{background: 'rgba(16, 185, 129, 0.15)', animationDelay: '1s'}}></div>
      </div>

      <div className="card w-full max-w-md bg-base-100 shadow-2xl relative z-10 backdrop-blur-sm border border-base-300">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary">🎯</span> Felicity
            </h1>
            <p className="text-sm opacity-70">Event Management System</p>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="alert alert-error shadow-lg mb-4 animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                className="input input-bordered w-full focus:input-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full focus:input-primary transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className={`btn btn-primary w-full mt-6 ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="link link-primary font-semibold">
                Register as Participant
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <p className="text-xs opacity-70 text-center mb-2 font-semibold">Demo Credentials:</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="opacity-60">Participant:</span>
                <span className="font-mono">demo@iiit.ac.in / demo123</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Organizer:</span>
                <span className="font-mono">organizer@felicity.org / org123</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Admin:</span>
                <span className="font-mono">admin@felicity.org / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
