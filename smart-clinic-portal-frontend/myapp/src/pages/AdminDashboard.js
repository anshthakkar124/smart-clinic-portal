import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI, organizationsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle,
  Users,
  Activity,
  TrendingUp,
  Loader2,
  Building2,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${tone}-100`}>
        <Icon className={`h-6 w-6 text-${tone}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const StatusBarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="h-56 flex items-end gap-5">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center">
          <div
            className="w-full max-w-[48px] bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-xl"
            style={{ height: `${(item.value / max) * 100}%` }}
          />
          <span className="mt-3 text-xs font-medium text-gray-600 capitalize">{item.label}</span>
          <span className="text-xs text-gray-500">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const TrendChart = ({ data }) => {
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.organizationId) {
      Promise.all([fetchOrganization(), fetchAppointments(), fetchDoctorCount()])
        .catch(() => null)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

  const fetchOrganization = async () => {
    try {
      const response = await organizationsAPI.getById(user.organizationId);
      setOrganization(response.data?.organization || null);
    } catch (error) {
      console.error('Organization fetch error:', error);
      toast.error('Unable to load clinic details');
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll({ organizationId: user.organizationId, limit: 200 });
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.appointments)
          ? response.data.appointments
          : [];
      setAppointments(list);
    } catch (error) {
      console.error('Appointment fetch error:', error);
      toast.error('Unable to load appointment data');
    }
  };

  const fetchDoctorCount = async () => {
    try {
      const response = await usersAPI.list({ organizationId: user.organizationId, role: 'doctor', includeInactive: true });
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : [];
      setDoctorCount(list.length);
    } catch (error) {
      console.error('Doctor fetch error:', error);
      toast.error('Unable to load doctor metrics');
    }
  };

  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((apt) => apt.status === 'pending').length;
    const completed = appointments.filter((apt) => apt.status === 'completed').length;
    const scheduled = appointments.filter((apt) => apt.status === 'scheduled').length;
    return {
      total,
      pending,
      completed,
      scheduled,
      doctors: doctorCount
    };
  }, [appointments, doctorCount]);

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

  const upcomingAppointments = useMemo(() => {
    const upcoming = appointments
      .filter((apt) => new Date(apt.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return upcoming.slice(0, 5);
  }, [appointments]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Clinic Admin</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2">
            {organization?.name ? `${organization.name} · ${organization.type?.replace('_', ' ') || 'Clinic'}` : 'Manage your clinic performance at a glance.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/manage-doctors')} className="btn-secondary inline-flex items-center">
            <Users className="h-4 w-4 mr-2" /> Manage doctors
          </button>
          <button onClick={() => navigate('/clinic-settings')} className="btn-primary inline-flex items-center">
            <Building2 className="h-4 w-4 mr-2" /> Clinic settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total appointments" value={stats.total} icon={Calendar} tone="blue" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} tone="yellow" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} tone="green" />
        <StatCard title="Doctors" value={stats.doctors} icon={Users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Appointments by status</h2>
            <span className="text-xs text-gray-500">Live snapshot</span>
          </div>
          <StatusBarChart data={statusChartData} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">7 day trend</h2>
            <span className="text-xs text-gray-500">Daily totals</span>
          </div>
          <TrendChart data={trendChartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming appointments</h2>
            <button onClick={() => navigate('/admin-appointments')} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p>No upcoming appointments scheduled.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcomingAppointments.map((apt) => (
                <li key={apt._id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{apt.patient?.name || 'Patient'} <span className="text-xs text-gray-400 font-normal">with</span> {apt.doctor?.name || 'Doctor'}</p>
                    <p className="text-xs text-gray-500 mt-1">{apt.reason || 'No reason provided'}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{new Date(apt.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{apt.startTime} - {apt.endTime}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Operational insights</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <Activity className="h-4 w-4 mt-1 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-900">Utilization</p>
                  <p>{stats.scheduled} scheduled · {stats.pending} pending review</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 mt-1 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Completion ratio</p>
                  <p>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% completed this week</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClipboardList className="h-4 w-4 mt-1 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">Team coverage</p>
                  <p>{stats.doctors} active doctors on staff</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Clinic quick actions</h2>
            <div className="space-y-3 text-sm">
              <button onClick={() => navigate('/manage-doctors')} className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition">
                <span className="font-medium text-gray-700">Recruit / onboard doctor</span>
                <ArrowRight className="h-4 w-4 text-primary-600" />
              </button>
              <button onClick={() => navigate('/admin-appointments')} className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition">
                <span className="font-medium text-gray-700">Review appointments</span>
                <ArrowRight className="h-4 w-4 text-primary-600" />
              </button>
              <button onClick={() => navigate('/clinic-settings')} className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition">
                <span className="font-medium text-gray-700">Update clinic profile</span>
                <ArrowRight className="h-4 w-4 text-primary-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
