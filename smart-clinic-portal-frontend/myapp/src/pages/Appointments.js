import React, { useEffect, useState } from 'react';
import { Calendar, Plus, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll({});
      const list = Array.isArray(res.data) ? res.data : (res.data?.appointments || []);
      setAppointments(list);
    } catch (e) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    try {
      await appointmentsAPI.update(id, { status: 'cancelled' });
      toast.success('Appointment cancelled');
      load();
    } catch (e) {
      toast.error('Failed to cancel appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          </div>
          <Link to="/book-appointment" className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-gray-600">No appointments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((a) => (
                  <tr key={a._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{a.startTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.doctor?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.reason || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{a.status}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'pending' || a.status === 'confirmed' ? (
                        <button onClick={() => cancel(a._id)} className="inline-flex items-center text-red-600 hover:text-red-700 text-sm">
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
