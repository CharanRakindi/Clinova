import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';

function App() {
  return (
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
            {/* Admin Routes */}
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
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
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
