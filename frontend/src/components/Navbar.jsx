import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="navbar bg-base-100 shadow-2xl sticky top-0 z-50 backdrop-blur-md bg-opacity-90 border-b border-primary/20 transition-all duration-300">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden hover:bg-primary/10 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow-2xl bg-base-100/95 backdrop-blur-md rounded-box w-52 border border-primary/20">
            {user?.role === "participant" && (
              <>
                <li><Link to="/participant" className={`hover:bg-primary/20 transition-all ${isActive("/participant") ? "bg-primary/30" : ""}`}>📊 Dashboard</Link></li>
                <li><Link to="/events" className={`hover:bg-primary/20 transition-all ${isActive("/events") ? "bg-primary/30" : ""}`}>🎪 Browse Events</Link></li>
                <li><Link to="/organizers" className={`hover:bg-primary/20 transition-all ${isActive("/organizers") ? "bg-primary/30" : ""}`}>🏢 Clubs/Organizers</Link></li>
              </>
            )}
            {user?.role === "organizer" && (
              <>
                <li><Link to="/organizer" className={`hover:bg-primary/20 transition-all ${isActive("/organizer") ? "bg-primary/30" : ""}`}>📊 Dashboard</Link></li>
                <li><Link to="/organizer/create-event" className={`hover:bg-primary/20 transition-all ${isActive("/organizer/create-event") ? "bg-primary/30" : ""}`}>➕ Create Event</Link></li>
                <li><Link to="/organizer/ongoing-events" className={`hover:bg-primary/20 transition-all ${isActive("/organizer/ongoing-events") ? "bg-primary/30" : ""}`}>📅 Ongoing Events</Link></li>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <li><Link to="/admin" className={`hover:bg-primary/20 transition-all ${isActive("/admin") ? "bg-primary/30" : ""}`}>⚙️ Dashboard</Link></li>
                <li><Link to="/admin" className={`hover:bg-primary/20 transition-all ${isActive("/admin") ? "bg-primary/30" : ""}`}>🏢 Manage Clubs/Organizers</Link></li>
                <li><Link to="/admin/password-resets" className={`hover:bg-primary/20 transition-all ${isActive("/admin/password-resets") ? "bg-primary/30" : ""}`}>🔑 Password Reset Requests</Link></li>
              </>
            )}
          </ul>
        </div>
        <Link to={`/${user?.role}`} className="btn btn-ghost normal-case text-xl font-bold hover:bg-primary/10 transition-all group">
          <span className="text-primary animate-pulse group-hover:scale-110 transition-transform">🎯</span> 
          <span className="text-gradient">Felicity</span>
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {user?.role === "participant" && (
            <>
              <li>
                <Link to="/participant" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/participant") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/events" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/events") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  🎪 Browse Events
                </Link>
              </li>
              <li>
                <Link to="/organizers" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/organizers") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  🏢 Clubs/Organizers
                </Link>
              </li>
            </>
          )}
          {user?.role === "organizer" && (
            <>
              <li>
                <Link to="/organizer" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/organizer") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link to="/organizer/create-event" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/organizer/create-event") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  ➕ Create Event
                </Link>
              </li>
              <li>
                <Link to="/organizer/ongoing-events" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/organizer/ongoing-events") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  📅 Ongoing Events
                </Link>
              </li>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <li>
                <Link to="/admin" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/admin") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  ⚙️ Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/admin") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  🏢 Manage Clubs
                </Link>
              </li>
              <li>
                <Link to="/admin/password-resets" className={`btn btn-ghost btn-sm hover:shadow-lg hover:shadow-primary/30 transition-all ${isActive("/admin/password-resets") ? "bg-primary/20 border border-primary/40" : ""}`}>
                  🔑 Password Resets
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
      
      <div className="navbar-end gap-2">
        <Link to="/profile" className="btn btn-ghost btn-circle avatar placeholder group hover:scale-110 transition-all">
          <div className="bg-gradient-to-br from-primary to-success text-primary-content rounded-full w-10 shadow-lg shadow-primary/50 group-hover:shadow-primary/70 transition-all">
            <span className="text-lg font-bold">
              {user?.firstName?.charAt(0) || user?.organizerName?.charAt(0) || "U"}
            </span>
          </div>
        </Link>
        <button onClick={handleLogout} className="btn btn-outline btn-sm border-error/50 text-error hover:bg-error hover:text-error-content hover:border-error transition-all hover:scale-105">
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;