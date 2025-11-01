import React, { useState, useEffect } from 'react';
import { organizationsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Users as UsersIcon,
  Activity
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchOrganizations();
    fetchUserStats();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsAPI.getAll();
      const list = Array.isArray(response.data) ? response.data : (response.data?.organizations || []);
      setOrganizations(list);
    } catch (error) {
      toast.error('Failed to fetch organizations');
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await analyticsAPI.getUsers();
      setUserStats(res.data);
    } catch (e) {
      console.error('Error fetching user analytics:', e);
    }
  };

  const orgTypeCounts = () => {
    const counts = { hospital: 0, clinic: 0, medical_center: 0, other: 0 };
    organizations.forEach(o => {
      if (o.type && counts[o.type] !== undefined) counts[o.type] += 1; else counts.other += 1;
    });
    return counts;
  };

  // Vertical bar for chart
  const VBar = ({ label, value, max }) => (
    <div className="flex flex-col items-center mx-2" title={`${label}: ${value}`}>
      <div className="w-8 bg-primary-100 rounded-t flex items-end" style={{ height: 140 }}>
        <div className="w-8 bg-primary-600 rounded-t" style={{ height: `${max ? Math.max(4, Math.round((value / max) * 140)) : 0}px` }} />
      </div>
      <div className="mt-2 text-xs text-gray-600 capitalize text-center w-12 truncate">{label}</div>
      <div className="text-xs text-gray-900">{value}</div>
    </div>
  );

  // Pie chart using CSS conic-gradient
  const Pie = ({ segments }) => {
    const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
    let current = 0;
    const stops = segments.map((seg) => {
      const start = (current / total) * 360;
      current += seg.value || 0;
      const end = (current / total) * 360;
      return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');
    return (
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <div className="rounded-full" style={{ width: 220, height: 220, background: `conic-gradient(${stops})` }} />
        <div className="absolute bg-white rounded-full" style={{ width: 120, height: 120 }} />
      </div>
    );
  };

  const handleDeleteOrganization = async (orgId) => {
    if (window.confirm('Are you sure you want to deactivate this organization?')) {
      try {
        await organizationsAPI.delete(orgId);
        toast.success('Organization deactivated successfully');
        fetchOrganizations();
      } catch (error) {
        toast.error('Failed to deactivate organization');
        console.error('Error deleting organization:', error);
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all organizations and system-wide settings
              </p>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100"><UsersIcon className="h-6 w-6 text-blue-600"/></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats?.activityStats?.total || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100"><Activity className="h-6 w-6 text-green-600"/></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats?.activityStats?.active || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100"><Building2 className="h-6 w-6 text-purple-600"/></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Organizations</p>
              <p className="text-2xl font-semibold text-gray-900">{organizations.length}</p>
            </div>
          </div>
        </div>

        {/* Analytics View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
            {userStats?.roleDistribution?.length ? (
              <div className="flex items-end justify-center h-48">
                {userStats.roleDistribution.map(r => (
                  <VBar key={r._id} label={r._id} value={r.count} max={Math.max(...userStats.roleDistribution.map(x=>x.count),1)} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No data.</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Organizations by Type</h3>
            {(() => { const c = orgTypeCounts(); const segs = [
              { label: 'Hospital', value: c.hospital, color: '#2563eb' },
              { label: 'Medical Center', value: c.medical_center, color: '#7c3aed' },
              { label: 'Clinic', value: c.clinic, color: '#16a34a' },
              { label: 'Other', value: c.other, color: '#f59e0b' },
            ]; const total = segs.reduce((s,x)=>s+x.value,0); return (
              <div className="flex items-center">
                <Pie segments={segs} />
                <div className="ml-6 space-y-2">
                  {segs.map(s => (
                    <div key={s.label} className="flex items-center text-sm">
                      <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-700 mr-2">{s.label}</span>
                      <span className="text-gray-500">{s.value} {total ? `(${Math.round((s.value/total)*100)}%)` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            );})()}
          </div>
        </div>

        {/* Organizations Table (moved to Organizations page; kept here only if needed) */}
       
       
       
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
