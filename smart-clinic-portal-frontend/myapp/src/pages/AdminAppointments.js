import React, { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Stethoscope,
  AlertCircle,
  X
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, appointment: null, reason: '' });

  useEffect(() => {
    if (user?.organizationId) {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (!user?.organizationId) {
        toast.error('No organization assigned. Please contact support.');
        setLoading(false);
        return;
      }
      const res = await appointmentsAPI.getAll({ organizationId: user.organizationId, limit: 200 });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : [];
      setAppointments(list);
      console.log('Fetched appointments:', list.length);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointment) => {
    setUpdating(true);
    try {
      await appointmentsAPI.update(appointment._id, { status: 'scheduled' });
      toast.success('Appointment approved successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Approve appointment error:', error);
      toast.error('Failed to approve appointment');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setUpdating(true);
    try {
      await appointmentsAPI.update(rejectModal.appointment._id, {
        status: 'rejected',
        rejectionReason: rejectModal.reason
      });
      toast.success('Appointment rejected');
      setRejectModal({ open: false, appointment: null, reason: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Reject appointment error:', error);
      toast.error('Failed to reject appointment');
    } finally {
      setUpdating(false);
    }
  };

  // Helper to get date/time from appointment
  const getAppointmentDate = (apt) => {
    if (apt.date) return new Date(apt.date);
    if (apt.appointmentDate) return new Date(apt.appointmentDate);
    return new Date();
  };

  const getAppointmentTime = (apt) => {
    if (apt.startTime && apt.endTime) return `${apt.startTime} - ${apt.endTime}`;
    if (apt.appointmentTime) {
      const start = apt.appointmentTime;
      const duration = apt.duration || 30;
      const [hours, mins] = start.split(':');
      const endTime = new Date();
      endTime.setHours(parseInt(hours), parseInt(mins) + duration);
      const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      return `${start} - ${endStr}`;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage all appointment requests.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Appointments ({appointments.length})</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No appointments found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.patient?.name || 'Patient'}</p>
                          <p className="text-xs text-gray-500">{apt.patient?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.doctor?.name || 'Unassigned'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{getAppointmentDate(apt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{getAppointmentTime(apt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{apt.reason || 'No reason provided'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
                      {apt.rejectionReason && apt.status === 'rejected' && (
                        <p className="text-xs text-red-600 mt-1" title={apt.rejectionReason}>
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Rejected
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {apt.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(apt)}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, appointment: apt, reason: '' })}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      {apt.status === 'rejected' && apt.rejectionReason && (
                        <button
                          onClick={() => setRejectModal({ open: true, appointment: apt, reason: apt.rejectionReason })}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          View reason
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Appointment</h3>
              <button
                onClick={() => setRejectModal({ open: false, appointment: null, reason: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {rejectModal.appointment && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Patient:</span> {rejectModal.appointment.patient?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {getAppointmentDate(rejectModal.appointment).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Please provide a reason for rejecting this appointment..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">This reason will be visible to the patient.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, appointment: null, reason: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={updating || !rejectModal.reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
