import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';
import PatientDashboard from '../pages/PatientDashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  switch (user.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this dashboard.</p>
          </div>
        </div>
      );
  }
};

export default RoleBasedDashboard;
