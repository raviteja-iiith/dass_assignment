import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ParticipantDashboard from "./pages/participant/Dashboard";
import BrowseEvents from "./pages/BrowseEvents";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import OrganizerDashboard from "./pages/organizer/Dashboard";
import CreateEvent from "./pages/organizer/CreateEvent";
import EditEvent from "./pages/organizer/EditEvent";
import EventAnalytics from "./pages/organizer/EventAnalytics";
import AdminDashboard from "./pages/admin/Dashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-theme="forest">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-theme="forest">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/participant" />} />
        
        {/* Participant Routes */}
        <Route path="/participant" element={<ProtectedRoute role="participant"><ParticipantDashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><BrowseEvents /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Organizer Routes */}
        <Route path="/organizer" element={<ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/organizer/create-event" element={<ProtectedRoute role="organizer"><CreateEvent /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/edit" element={<ProtectedRoute role="organizer"><EditEvent /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/analytics" element={<ProtectedRoute role="organizer"><EventAnalytics /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to={user ? `/${user.role}` : "/login"} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
