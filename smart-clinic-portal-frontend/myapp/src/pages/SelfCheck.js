import React, { useEffect, useState } from 'react';
import { Stethoscope, Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentsAPI, selfCheckInAPI } from '../services/api';
import toast from 'react-hot-toast';

const SelfCheck = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, checksRes] = await Promise.all([
          appointmentsAPI.getAll({ page: 1, limit: 10 }),
          selfCheckInAPI.getAll({ limit: 5 })
        ]);
        const appList = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.appointments || []);
        setAppointments(appList);
        setCheckIns(checksRes.data?.checkIns || []);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <Stethoscope className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Self Check-in</h1>
        </div>
        <p className="text-gray-600">Complete your health assessment before your appointment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center"><Calendar className="h-5 w-5 mr-2 text-primary-600"/> Upcoming Appointments</h2>
          </div>
          {appointments.length === 0 ? (
            <p className="text-gray-600">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {appointments.slice(0,5).map((a) => (
                <li key={a._id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{new Date(a.date).toLocaleDateString()} • {a.startTime}</p>
                    <p className="text-sm text-gray-600">{a.reason || 'Appointment'}{a.doctor?.name ? ` • Dr. ${a.doctor.name}` : ''}</p>
                  </div>
                  <Link to={`/self-checkin/${a._id}`} className="btn-primary flex items-center">
                    Start Check-in <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent self check-ins */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ClipboardList className="h-5 w-5 mr-2 text-primary-600"/> Recent Check-ins</h2>
          {checkIns.length === 0 ? (
            <p className="text-gray-600">No self check-ins yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {checkIns.map((c) => (
                <li key={c._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{new Date(c.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Risk: {c.assessmentResults?.riskLevel || 'N/A'} • Status: {c.status}</p>
                    </div>
                    <Link to={`/self-checkin/${c.appointment}`} className="text-primary-600 text-sm">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfCheck;
