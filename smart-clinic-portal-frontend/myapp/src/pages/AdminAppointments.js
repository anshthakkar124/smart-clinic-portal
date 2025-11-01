import React, { useEffect, useMemo, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  User,
  Stethoscope,
  Activity,
  Eye,
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

const StatCard = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${accent}-100`}>
        <Icon className={`h-6 w-6 text-${accent}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="h-56 flex items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center">
          <div
            className="w-full max-w-[36px] bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg"
            style={{ height: `${(item.value / max) * 100}%` }}
          />
          <span className="mt-3 text-xs font-medium text-gray-600 capitalize">{item.label}</span>
          <span className="text-xs text-gray-500">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const LineTrend = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="h-56 flex items-end gap-4">
      {data.map((point) => (
        <div key={point.label} className="flex-1 flex flex-col items-center">
          <div className="relative w-full flex justify-center">
            <div
              className="w-1 rounded-full bg-primary-400"
              style={{ height: `${(point.value / max) * 100}%` }}
            />
            <div className="absolute -top-2 h-2 w-2 rounded-full bg-primary-600" />
          </div>
          <span className="mt-3 text-xs font-medium text-gray-600">{point.label}</span>
          <span className="text-xs text-gray-500">{point.value}</span>
        </div>
      ))}
    </div>
  );
};

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    doctor: 'all',
    date: ''
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll({ organizationId: user.organizationId, limit: 200 });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : [];
      setAppointments(list);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { total: appointments.length, pending: 0, scheduled: 0, completed: 0, cancelled: 0 };
    appointments.forEach((apt) => {
      if (counts[apt.status] !== undefined) {
        counts[apt.status] += 1;
      }
    });
    return counts;
  }, [appointments]);

  const doctors = useMemo(() => {
    const map = new Map();
    appointments.forEach((apt) => {
      if (apt.doctor?._id) {
        map.set(apt.doctor._id, apt.doctor.name || 'Doctor');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesStatus = filters.status === 'all' ? true : apt.status === filters.status;
      const matchesDoctor = filters.doctor === 'all' ? true : apt.doctor?._id === filters.doctor;
      const matchesDate = filters.date ? new Date(apt.date).toDateString() === new Date(filters.date).toDateString() : true;
      const matchesSearch = filters.search
        ? [apt.patient?.name, apt.doctor?.name, apt.reason, apt.organization?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(filters.search.toLowerCase()))
        : true;
      return matchesStatus && matchesDoctor && matchesDate && matchesSearch;
    });
  }, [appointments, filters]);

  const statusChartData = useMemo(() => (
    ['pending', 'scheduled', 'completed', 'cancelled'].map((status) => ({
      label: status,
      value: appointments.filter((apt) => apt.status === status).length
    }))
  ), [appointments]);

  const trendChartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      const value = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString();
      }).length;
      return { label, value };
    });
    return days;
  }, [appointments]);

  const handleStatusUpdate = async (appointment, status) => {
    setUpdating(true);
    try {
      await appointmentsAPI.update(appointment._id, { status });
      toast.success(`Appointment ${status}`);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Update appointment status error:', error);
      toast.error('Unable to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage every appointment across your clinic.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total" value={statusCounts.total} icon={Calendar} accent="blue" />
        <StatCard title="Pending" value={statusCounts.pending} icon={Clock} accent="yellow" />
        <StatCard title="Scheduled" value={statusCounts.scheduled} icon={Activity} accent="indigo" />
        <StatCard title="Completed" value={statusCounts.completed} icon={CheckCircle} accent="green" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search by patient, doctor, reason or organization"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="input-field"
            value={filters.doctor}
            onChange={(e) => setFilters((prev) => ({ ...prev, doctor: e.target.value }))}
          >
            <option value="all">All doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="input-field"
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ search: '', status: 'all', doctor: 'all', date: '' })}
            className="btn-secondary inline-flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Appointments by status</h3>
            <span className="text-xs text-gray-500">Current snapshot</span>
          </div>
          <BarChart data={statusChartData} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">7 day trend</h3>
            <span className="text-xs text-gray-500">Daily volume</span>
          </div>
          <LineTrend data={trendChartData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Appointments ({filteredAppointments.length})</h3>
          <p className="text-xs text-gray-500">Showing most recent activity</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No appointments match your filters.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.patient?.name || 'Patient'}</p>
                          <p className="text-xs text-gray-500">{apt.reason || 'No reason provided'}</p>
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
                          <p className="text-xs text-gray-500">{apt.organization?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{new Date(apt.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{apt.startTime} - {apt.endTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Appointment details</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="text-xs uppercase text-gray-500">Patient</p>
                <p className="font-medium text-gray-900">{selectedAppointment.patient?.name}</p>
                <p>{selectedAppointment.patient?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Doctor</p>
                <p className="font-medium text-gray-900">{selectedAppointment.doctor?.name}</p>
                <p>{selectedAppointment.organization?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Date</p>
                  <p>{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Time</p>
                  <p>{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Reason</p>
                <p>{selectedAppointment.reason || 'No additional details provided.'}</p>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs uppercase text-gray-500">Notes</p>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedAppointment(null)} className="btn-secondary">Close</button>
              {['pending', 'scheduled'].includes(selectedAppointment.status) && (
                <>
                  {selectedAppointment.status !== 'completed' && (
                    <button
                      disabled={updating}
                      onClick={() => handleStatusUpdate(selectedAppointment, 'completed')}
                      className="btn-primary inline-flex items-center"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Mark completed
                    </button>
                  )}
                  {selectedAppointment.status !== 'cancelled' && (
                    <button
                      disabled={updating}
                      onClick={() => handleStatusUpdate(selectedAppointment, 'cancelled')}
                      className="btn-danger inline-flex items-center"
                    >
                      {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;

