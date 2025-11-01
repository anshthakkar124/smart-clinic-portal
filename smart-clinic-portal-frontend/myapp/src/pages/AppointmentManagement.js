import React, { useState, useEffect } from 'react';
import { appointmentsAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const AppointmentManagement = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filters]);

  const fetchAppointments = async () => {
    try {
      let response;
      if (user.role === 'doctor') {
        response = await appointmentsAPI.getAll({ doctorId: user.userId });
      } else if (user.role === 'admin') {
        response = await appointmentsAPI.getAll({ organizationId: user.organizationId });
      } else {
        response = await appointmentsAPI.getAll({ patientId: user.userId });
      }
      
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.date) {
      filtered = filtered.filter(apt => 
        new Date(apt.date).toDateString() === new Date(filters.date).toDateString()
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient?.name?.toLowerCase().includes(searchTerm) ||
        apt.doctor?.name?.toLowerCase().includes(searchTerm) ||
        apt.organization?.name?.toLowerCase().includes(searchTerm) ||
        apt.reason?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleAppointmentAction = async (appointmentId, action, reason = '') => {
    try {
      const updateData = { status: action };
      if (reason) {
        updateData.notes = reason;
      }

      await appointmentsAPI.update(appointmentId, updateData);
      toast.success(`Appointment ${action} successfully`);
      fetchAppointments();
      setShowModal(false);
      setSelectedAppointment(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(`Failed to ${action} appointment`);
      console.error(`Error ${action}ing appointment:`, error);
    }
  };

  const openRejectionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    handleAppointmentAction(selectedAppointment._id, 'rejected', rejectionReason);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user.role === 'doctor' ? 'Manage your appointments' : 
               user.role === 'admin' ? 'Manage clinic appointments' : 
               'View your appointments'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="input-field"
            />
            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Appointments ({filteredAppointments.length})
            </h3>
          </div>
          
          <div className="overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No appointments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.role === 'patient' ? 
                                    `Dr. ${appointment.doctor?.name || 'Unknown'}` : 
                                    appointment.patient?.name || 'Unknown Patient'
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(appointment.date).toLocaleDateString()} at {appointment.startTime}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {appointment.organization?.name || 'Unknown Organization'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {appointment.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1 capitalize">{appointment.status}</span>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setSelectedAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {user.role === 'doctor' && appointment.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleAppointmentAction(appointment._id, 'scheduled')}
                                className="text-green-600 hover:text-green-900"
                                title="Accept"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => openRejectionModal(appointment)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {user.role === 'patient' && appointment.status === 'scheduled' && (
                            <button 
                              onClick={() => handleAppointmentAction(appointment._id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-3 ml-16 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start">
                          <MessageSquare className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Appointment
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this appointment request.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="input-field w-full"
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                    setRejectionReason('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  Reject Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && !showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Appointment Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Patient:</span> {selectedAppointment.patient?.name}
                </div>
                <div>
                  <span className="font-medium">Doctor:</span> Dr. {selectedAppointment.doctor?.name}
                </div>
                <div>
                  <span className="font-medium">Organization:</span> {selectedAppointment.organization?.name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {new Date(selectedAppointment.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {selectedAppointment.startTime} - {selectedAppointment.endTime}
                </div>
                <div>
                  <span className="font-medium">Reason:</span> {selectedAppointment.reason}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusIcon(selectedAppointment.status)}
                    <span className="ml-1 capitalize">{selectedAppointment.status}</span>
                  </span>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <span className="font-medium">Notes:</span> {selectedAppointment.notes}
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
