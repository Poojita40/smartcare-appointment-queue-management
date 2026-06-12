import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomeView from "./components/HomeView";
import PatientLogin from "./components/PatientLogin";
import DoctorLogin from "./components/DoctorLogin";
import AdminLogin from "./components/AdminLogin";
import Register from "./components/Register";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Attempt state recovery on load
    const stored = localStorage.getItem("smartcare_session");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("smartcare_session");
      }
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("smartcare_session", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("smartcare_session");
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Core public channels */}
        <Route path="/" element={<HomeView />} />
        <Route
          path="/patient-login"
          element={
            currentUser?.role === "PATIENT" ? (
              <Navigate to="/patient/dashboard" replace />
            ) : (
              <PatientLogin onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/doctor-login"
          element={
            currentUser?.role === "DOCTOR" ? (
              <Navigate to="/doctor/dashboard" replace />
            ) : (
              <DoctorLogin onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/admin-login"
          element={
            currentUser?.role === "ADMIN" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        
        {/* Legacy redirect for safety */}
        <Route path="/login" element={<Navigate to="/patient-login" replace />} />

        {/* Auth protected workspace layers */}
        <Route
          path="/patient/dashboard"
          element={
            currentUser?.role === "PATIENT" ? (
              <PatientDashboard patientUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/patient-login" replace />
            )
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            currentUser?.role === "DOCTOR" ? (
              <DoctorDashboard doctorUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/doctor-login" replace />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            currentUser?.role === "ADMIN" ? (
              <AdminDashboard adminUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />

        {/* Wildcard reroute fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
