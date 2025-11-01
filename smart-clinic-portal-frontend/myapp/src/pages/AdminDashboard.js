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

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const bgClasses = {
    blue: 'bg-blue-100',
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100'
  };
  const textClasses = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };
  const bgClass = bgClasses[tone] || 'bg-gray-100';
  const textClass = textClasses[tone] || 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgClass}`}>
          <Icon className={`h-6 w-6 ${textClass}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const StatusBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="h-56 flex items-end gap-5">
      {data.map((item) => {
        const height = max > 0 ? `${((item.value || 0) / max) * 100}%` : '0%';
        const minHeight = (item.value || 0) > 0 ? '4px' : '0px';
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center">
            <div
              className="w-full max-w-[48px] bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-xl transition-all duration-300"
              style={{ height, minHeight }}
            />
            <span className="mt-3 text-xs font-medium text-gray-600 capitalize">{item.label}</span>
            <span className="text-xs text-gray-500">{item.value || 0}</span>
          </div>
        );
      })}
    </div>
  );
};

const TrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="h-56 flex items-end gap-4">
      {data.map((point) => {
        const height = max > 0 ? `${((point.value || 0) / max) * 100}%` : '0%';
        const minHeight = (point.value || 0) > 0 ? '4px' : '0px';
        return (
          <div key={point.label} className="flex-1 flex flex-col items-center">
            <div className="relative w-full flex justify-center">
              <div
                className="w-1 rounded-full bg-blue-400 transition-all duration-300"
                style={{ height, minHeight }}
              />
              {(point.value || 0) > 0 && (
                <div className="absolute -top-2 h-2 w-2 rounded-full bg-blue-600" />
              )}
            </div>
            <span className="mt-3 text-xs font-medium text-gray-600">{point.label}</span>
            <span className="text-xs text-gray-500">{point.value || 0}</span>
          </div>
        );
      })}
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
      if (!user?.organizationId) {
        console.warn('No organizationId found for admin user');
        return;
      }
      const response = await appointmentsAPI.getAll({ organizationId: user.organizationId, limit: 200 });
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.appointments)
          ? response.data.appointments
          : [];
      setAppointments(list);
      console.log('Fetched appointments for dashboard:', list.length);
      console.log('Sample appointment:', list[0]);
      console.log('Appointment statuses:', list.map(apt => apt.status));
    } catch (error) {
      console.error('Appointment fetch error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Unable to load appointment data');
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

  const statusChartData = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return [
        { label: 'pending', value: 0 },
        { label: 'scheduled', value: 0 },
        { label: 'completed', value: 0 },
        { label: 'cancelled', value: 0 }
      ];
    }
    const data = ['pending', 'scheduled', 'completed', 'cancelled'].map((status) => ({
      label: status,
      value: appointments.filter((apt) => apt && apt.status === status).length
    }));
    console.log('Status chart data:', data);
    console.log('Total appointments for chart:', appointments.length);
    return data;
  }, [appointments]);

  const trendChartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      const value = appointments.filter((apt) => {
        const aptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : (apt.date ? new Date(apt.date) : null);
        if (!aptDate) return false;
        return aptDate.toDateString() === date.toDateString();
      }).length;
      return { label, value };
    });
    return days;
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const getAppointmentDate = (apt) => {
      if (apt.appointmentDate) return new Date(apt.appointmentDate);
      if (apt.date) return new Date(apt.date);
      return null;
    };

    const upcoming = appointments
      .filter((apt) => {
        const aptDate = getAppointmentDate(apt);
        if (!aptDate) return false;
        return aptDate >= new Date();
      })
      .sort((a, b) => {
        const dateA = getAppointmentDate(a);
        const dateB = getAppointmentDate(b);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      });
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
              {upcomingAppointments.map((apt) => {
                const getAppointmentDate = () => {
                  if (apt.appointmentDate) return new Date(apt.appointmentDate);
                  if (apt.date) return new Date(apt.date);
                  return new Date();
                };

                const getAppointmentTime = () => {
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
                  <li key={apt._id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{apt.patient?.name || 'Patient'} <span className="text-xs text-gray-400 font-normal">with</span> {apt.doctor?.name || 'Doctor'}</p>
                      <p className="text-xs text-gray-500 mt-1">{apt.reason || 'No reason provided'}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{getAppointmentDate().toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{getAppointmentTime()}</p>
                    </div>
                  </li>
                );
              })}
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
