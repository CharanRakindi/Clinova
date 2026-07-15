import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Splash from './components/Splash';

// Public routes — eager for first paint
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Activate from './pages/Activate';

// Role workspaces — code-split to keep initial bundle smaller
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorPatients = lazy(() => import('./pages/doctor/DoctorPatients'));
const DoctorPatientDetail = lazy(() => import('./pages/doctor/DoctorPatientDetail'));
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const PatientAppointments = lazy(() => import('./pages/patient/PatientAppointments'));
const PatientMedicalRecords = lazy(() => import('./pages/patient/PatientMedicalRecords'));
const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));
const LabTechDashboard = lazy(() => import('./pages/labtech/LabTechDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<RootLayout />}>
                <Route path="/profile" element={<Profile />} />

                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['doctor', 'admin']} />}>
                  <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                  <Route path="/doctor/patients" element={<DoctorPatients />} />
                  <Route path="/doctor/patients/:patientId" element={<DoctorPatientDetail />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['patient']} />}>
                  <Route path="/patient/dashboard" element={<PatientDashboard />} />
                  <Route path="/patient/appointments" element={<PatientAppointments />} />
                  <Route path="/patient/records" element={<PatientMedicalRecords />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['receptionist', 'admin']} />}>
                  <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
                </Route>

                <Route element={<RoleRoute allowedRoles={['lab_technician', 'admin']} />}>
                  <Route path="/labtech/dashboard" element={<LabTechDashboard />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
