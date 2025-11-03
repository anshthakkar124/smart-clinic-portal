import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI, prescriptionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Plus,
  Eye,
  User,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0
  });

  useEffect(() => {
    fetchAppointments();
    fetchPrescriptions();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll({ 
        doctorId: user.userId,
        limit: 20 
      });
      setAppointments(response.data.appointments);
      
      const today = new Date().toDateString();
      const todayAppts = response.data.appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      ).length;
      const pending = response.data.appointments.filter(apt => apt.status === 'pending').length;
      const completed = response.data.appointments.filter(apt => apt.status === 'completed').length;
      
      setStats(prev => ({
        ...prev,
        todayAppointments: todayAppts,
        pendingAppointments: pending,
        completedAppointments: completed
      }));
    } catch (error) {
      toast.error('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionsAPI.getAll({ 
        doctorId: user.userId,
        limit: 10 
      });
      setPrescriptions(response.data.prescriptions);
      setStats(prev => ({ ...prev, totalPrescriptions: response.data.prescriptions.length }));
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const updateData = { status: action };
      if (action === 'rejected') {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        updateData.notes = reason;
      }
      
      await appointmentsAPI.update(appointmentId, updateData);
      toast.success(`Appointment ${action} successfully`);
      fetchAppointments();
    } catch (error) {
      toast.error(`Failed to ${action} appointment`);
      console.error(`Error ${action}ing appointment:`, error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, Dr. {user?.name} - Manage your appointments and patients
              </p>
            </div>
            <div className="flex space-x-3">
              <Link to="/prescription-management" className="btn-secondary inline-flex items-center">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>My Prescriptions</span>
              </Link>
              <Link to="/create-prescription" className="btn-primary inline-flex items-center">
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>New Prescription</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={Calendar}
            color="blue"
            subtitle="Scheduled for today"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingAppointments}
            icon={Clock}
            color="yellow"
            subtitle="Awaiting your response"
          />
          <StatCard
            title="Completed"
            value={stats.completedAppointments}
            icon={CheckCircle}
            color="green"
            subtitle="This month"
          />
          <StatCard
            title="Prescriptions"
            value={stats.totalPrescriptions}
            icon={FileText}
            color="purple"
            subtitle="Issued this month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your scheduled appointments for today
              </p>
            </div>
            
            <div className="overflow-hidden">
              {appointments.filter(apt => 
                new Date(apt.date).toDateString() === new Date().toDateString()
              ).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {appointments
                    .filter(apt => new Date(apt.date).toDateString() === new Date().toDateString())
                    .map((appointment) => (
                    <div key={appointment._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.patient?.name || 'Unknown Patient'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {appointment.startTime} - {appointment.endTime}
                              </p>
                              <p className="text-xs text-gray-400">
                                {appointment.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.status}
                          </span>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                Appointment requests awaiting your approval
              </p>
            </div>
            
            <div className="overflow-hidden">
              {appointments.filter(apt => apt.status === 'pending').length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No pending appointment requests</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {appointments
                    .filter(apt => apt.status === 'pending')
                    .slice(0, 5)
                    .map((appointment) => (
                    <div key={appointment._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.patient?.name || 'Unknown Patient'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.startTime}
                              </p>
                              <p className="text-xs text-gray-400">
                                {appointment.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleAppointmentAction(appointment._id, 'scheduled')}
                            className="text-green-600 hover:text-green-900"
                            title="Accept"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAppointmentAction(appointment._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your recently issued prescriptions
            </p>
          </div>
          
          <div className="overflow-hidden">
            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No prescriptions issued yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {prescriptions.slice(0, 5).map((prescription) => (
                  <div key={prescription._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {prescription.patient?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {prescription.medications?.length || 0} medications
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(prescription.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prescription.isDispensed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {prescription.isDispensed ? 'Dispensed' : 'Active'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/appointment-management" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View All Appointments</h3>
                <p className="text-sm text-gray-500">See your complete appointment schedule</p>
              </div>
            </div>
          </Link>
          
          <Link to="/create-prescription" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Issue Prescription</h3>
                <p className="text-sm text-gray-500">Create new prescription for patient</p>
              </div>
            </div>
          </Link>
          
          <Link to="/appointment-calendar" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
                <p className="text-sm text-gray-500">View appointments in calendar format</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
