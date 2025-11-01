import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import RoleBasedDashboard from './components/RoleBasedDashboard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import SelfCheck from './pages/SelfCheck';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import AppointmentManagement from './pages/AppointmentManagement';
import AppointmentCalendar from './pages/AppointmentCalendar';
import Prescriptions from './pages/Prescriptions';
import CreatePrescription from './pages/CreatePrescription';
import PrescriptionManagement from './pages/PrescriptionManagement';
import MyPrescriptions from './pages/MyPrescriptions';
import NotificationsPage from './pages/NotificationsPage';
import SelfCheckInForm from './pages/SelfCheckInForm';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Profile from './pages/Profile';
import OrganizationsAdmin from './pages/OrganizationsAdmin';
import OrganizationDetails from './pages/OrganizationDetails';
import UsersAdmin from './pages/UsersAdmin';
import ManageDoctors from './pages/ManageDoctors';
import AdminAppointments from './pages/AdminAppointments';
import ClinicSettings from './pages/ClinicSettings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <div className="App min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <RoleBasedDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/self-check" element={
              <ProtectedRoute>
                <Layout>
                  <SelfCheck />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Layout>
                  <Appointments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/book-appointment" element={
              <ProtectedRoute>
                <Layout>
                  <BookAppointment />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/appointment-management" element={
              <ProtectedRoute>
                <Layout>
                  <AppointmentManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin-appointments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminAppointments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/appointment-calendar" element={
              <ProtectedRoute>
                <Layout>
                  <AppointmentCalendar />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/prescriptions" element={
              <ProtectedRoute>
                <Layout>
                  <Prescriptions />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/create-prescription" element={
              <ProtectedRoute>
                <Layout>
                  <CreatePrescription />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/prescription-management" element={
              <ProtectedRoute>
                <Layout>
                  <PrescriptionManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/manage-doctors" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ManageDoctors />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-prescriptions" element={
              <ProtectedRoute>
                <Layout>
                  <MyPrescriptions />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/self-checkin/:appointmentId" element={
              <ProtectedRoute>
                <Layout>
                  <SelfCheckInForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clinic-settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ClinicSettings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/superadmin-dashboard" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Layout>
                  <SuperAdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Layout>
                  <OrganizationsAdmin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Layout>
                  <UsersAdmin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/organizations/:id" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Layout>
                  <OrganizationDetails />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* 404 route */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
