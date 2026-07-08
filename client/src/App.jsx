import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Splash from './components/Splash';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AuditLogs from './pages/admin/AuditLogs';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';

// Lab Tech pages
import LabTechDashboard from './pages/labtech/LabTechDashboard';

// Shared Profile
import Profile from './pages/Profile';

function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash only once per session
    const hasSeenSplash = sessionStorage.getItem('clinova_splash_seen');
    if (!hasSeenSplash) {
      setShowSplash(true);
      sessionStorage.setItem('clinova_splash_seen', 'true');
    }
  }, []);

  return (
    <>
      {showSplash && <Splash onComplete={() => setShowSplash(false)} />}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
              {/* Shared Route */}
              <Route path="/profile" element={<Profile />} />

              {/* Admin Routes */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>

              {/* Doctor Routes */}
              <Route element={<RoleRoute allowedRoles={['doctor', 'admin']} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/patients" element={<DoctorPatients />} />
                <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetail />} />
              </Route>

              {/* Patient Routes */}
              <Route element={<RoleRoute allowedRoles={['patient']} />}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/records" element={<PatientMedicalRecords />} />
              </Route>

              {/* Receptionist Routes */}
              <Route element={<RoleRoute allowedRoles={['receptionist', 'admin']} />}>
                <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
              </Route>

              {/* Lab Technician Routes */}
              <Route element={<RoleRoute allowedRoles={['lab_technician', 'admin']} />}>
                <Route path="/labtech/dashboard" element={<LabTechDashboard />} />
              </Route>
            </Route>
          </Route>
          
          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
