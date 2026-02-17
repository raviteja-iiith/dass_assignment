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
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            {user?.role === "participant" && (
              <>
                <li><Link to="/participant" className={isActive("/participant") ? "active" : ""}>Dashboard</Link></li>
                <li><Link to="/events" className={isActive("/events") ? "active" : ""}>Browse Events</Link></li>
              </>
            )}
            {user?.role === "organizer" && (
              <>
                <li><Link to="/organizer" className={isActive("/organizer") ? "active" : ""}>Dashboard</Link></li>
                <li><Link to="/organizer/create-event" className={isActive("/organizer/create-event") ? "active" : ""}>Create Event</Link></li>
              </>
            )}
            {user?.role === "admin" && (
              <li><Link to="/admin" className={isActive("/admin") ? "active" : ""}>Admin Panel</Link></li>
            )}
          </ul>
        </div>
        <Link to={`/${user?.role}`} className="btn btn-ghost normal-case text-xl font-bold">
          <span className="text-primary">🎯</span> Felicity
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          {user?.role === "participant" && (
            <>
              <li>
                <Link to="/participant" className={`btn btn-ghost btn-sm ${isActive("/participant") ? "btn-active" : ""}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/events" className={`btn btn-ghost btn-sm ${isActive("/events") ? "btn-active" : ""}`}>
                  Browse Events
                </Link>
              </li>
            </>
          )}
          {user?.role === "organizer" && (
            <>
              <li>
                <Link to="/organizer" className={`btn btn-ghost btn-sm ${isActive("/organizer") ? "btn-active" : ""}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/organizer/create-event" className={`btn btn-ghost btn-sm ${isActive("/organizer/create-event") ? "btn-active" : ""}`}>
                  Create Event
                </Link>
              </li>
            </>
          )}
          {user?.role === "admin" && (
            <li>
              <Link to="/admin" className={`btn btn-ghost btn-sm ${isActive("/admin") ? "btn-active" : ""}`}>
                Admin Panel
              </Link>
            </li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end gap-2">
        <Link to="/profile" className="btn btn-ghost btn-circle avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-10">
            <span className="text-lg">
              {user?.firstName?.charAt(0) || user?.organizerName?.charAt(0) || "U"}
            </span>
          </div>
        </Link>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;