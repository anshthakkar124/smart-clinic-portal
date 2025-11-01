import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  FileText, 
  Activity,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Brain,
  Shield,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [prescriptions, setPrescriptions] = useState(null);
  const [selfCheckIns, setSelfCheckIns] = useState(null);
  const [users, setUsers] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllAnalytics();
  }, [selectedPeriod]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        appointmentsRes,
        prescriptionsRes,
        selfCheckInsRes,
        usersRes,
        notificationsRes
      ] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getAppointments({ period: selectedPeriod }),
        analyticsAPI.getPrescriptions({ period: selectedPeriod }),
        analyticsAPI.getSelfCheckIns({ period: selectedPeriod }),
        analyticsAPI.getUsers(),
        analyticsAPI.getNotifications({ period: selectedPeriod })
      ]);

      setOverview(overviewRes.data);
      setAppointments(appointmentsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setSelfCheckIns(selfCheckInsRes.data);
      setUsers(usersRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <TrendingUp className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'prescriptions', name: 'Prescriptions', icon: FileText },
    { id: 'self-checkins', name: 'Self Check-ins', icon: Activity },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive insights and reporting for your healthcare organization
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="input-field"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button
                  onClick={fetchAllAnalytics}
                  className="btn-secondary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <button className="btn-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(overview.overview.totalUsers)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(overview.overview.totalAppointments)}</p>
                    <div className="flex items-center mt-1">
                      {getGrowthIcon(overview.growth.appointments)}
                      <span className={`text-sm ${getGrowthColor(overview.growth.appointments)}`}>
                        {overview.growth.appointments > 0 ? '+' : ''}{overview.growth.appointments}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(overview.overview.totalPrescriptions)}</p>
                    <div className="flex items-center mt-1">
                      {getGrowthIcon(overview.growth.prescriptions)}
                      <span className={`text-sm ${getGrowthColor(overview.growth.prescriptions)}`}>
                        {overview.growth.prescriptions > 0 ? '+' : ''}{overview.growth.prescriptions}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(overview.overview.totalCheckIns)}</p>
                    <div className="flex items-center mt-1">
                      {getGrowthIcon(overview.growth.checkIns)}
                      <span className={`text-sm ${getGrowthColor(overview.growth.checkIns)}`}>
                        {overview.growth.checkIns > 0 ? '+' : ''}{overview.growth.checkIns}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">This Month</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Appointments</span>
                    <span className="text-sm font-medium text-gray-900">{overview.monthlyStats.appointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prescriptions</span>
                    <span className="text-sm font-medium text-gray-900">{overview.monthlyStats.prescriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Check-ins</span>
                    <span className="text-sm font-medium text-gray-900">{overview.monthlyStats.checkIns}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Appointments</span>
                    <div className="flex items-center">
                      {getGrowthIcon(overview.growth.appointments)}
                      <span className={`text-sm ml-1 ${getGrowthColor(overview.growth.appointments)}`}>
                        {overview.growth.appointments > 0 ? '+' : ''}{overview.growth.appointments}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prescriptions</span>
                    <div className="flex items-center">
                      {getGrowthIcon(overview.growth.prescriptions)}
                      <span className={`text-sm ml-1 ${getGrowthColor(overview.growth.prescriptions)}`}>
                        {overview.growth.prescriptions > 0 ? '+' : ''}{overview.growth.prescriptions}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Check-ins</span>
                    <div className="flex items-center">
                      {getGrowthIcon(overview.growth.checkIns)}
                      <span className={`text-sm ml-1 ${getGrowthColor(overview.growth.checkIns)}`}>
                        {overview.growth.checkIns > 0 ? '+' : ''}{overview.growth.checkIns}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    View Detailed Reports
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    Export Data
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    Schedule Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && appointments && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status Distribution</h3>
                <div className="space-y-3">
                  {appointments.statusDistribution.map((status, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{status._id}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(status.count / appointments.completionStats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{status.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Appointments</span>
                    <span className="text-sm font-medium text-gray-900">{appointments.completionStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{appointments.completionStats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cancelled</span>
                    <span className="text-sm font-medium text-red-600">{appointments.completionStats.cancelled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900">
                      {appointments.completionStats.total > 0 
                        ? Math.round((appointments.completionStats.completed / appointments.completionStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Doctors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Doctors by Appointment Count</h3>
              <div className="space-y-3">
                {appointments.topDoctors.map((doctor, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{doctor.doctorName || 'Unknown Doctor'}</span>
                    <span className="text-sm font-medium text-gray-900">{doctor.count} appointments</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && prescriptions && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prescription Status</h3>
                <div className="space-y-3">
                  {prescriptions.statusDistribution.map((status, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{status._id}</span>
                      <span className="text-sm font-medium text-gray-900">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiry Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Expiry Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Prescriptions</span>
                    <span className="text-sm font-medium text-gray-900">{prescriptions.expiryAnalysis.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expiring Soon</span>
                    <span className="text-sm font-medium text-yellow-600">{prescriptions.expiryAnalysis.expiringSoon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expired</span>
                    <span className="text-sm font-medium text-red-600">{prescriptions.expiryAnalysis.expired}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Medications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Prescribed Medications</h3>
              <div className="space-y-3">
                {prescriptions.topMedications.map((medication, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{medication._id}</span>
                    <span className="text-sm font-medium text-gray-900">{medication.count} prescriptions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Self Check-ins Tab */}
        {activeTab === 'self-checkins' && selfCheckIns && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Level Distribution</h3>
                <div className="space-y-3">
                  {selfCheckIns.riskDistribution.map((risk, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{risk._id || 'Unknown'}</span>
                      <span className="text-sm font-medium text-gray-900">{risk.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Check-ins</span>
                    <span className="text-sm font-medium text-gray-900">{selfCheckIns.completionAnalysis.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">{selfCheckIns.completionAnalysis.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Flagged for Review</span>
                    <span className="text-sm font-medium text-red-600">{selfCheckIns.completionAnalysis.flagged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg. Completion Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(selfCheckIns.completionAnalysis.avgCompletionTime)} min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* COVID Screening */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">COVID-19 Screening Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selfCheckIns.covidScreening.hasSymptoms}</div>
                  <div className="text-sm text-gray-600">Reported Symptoms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selfCheckIns.covidScreening.hasBeenExposed}</div>
                  <div className="text-sm text-gray-600">Exposure Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selfCheckIns.covidScreening.isVaccinated}</div>
                  <div className="text-sm text-gray-600">Vaccinated</div>
                </div>
              </div>
            </div>

            {/* Mental Health Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mental Health Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selfCheckIns.mentalHealthTrends.avgMoodRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Mood Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selfCheckIns.mentalHealthTrends.avgAnxietyLevel.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Anxiety Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selfCheckIns.mentalHealthTrends.avgSleepQuality.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Sleep Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {selfCheckIns.mentalHealthTrends.avgStressLevel.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Stress Level</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && users && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Role Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
                <div className="space-y-3">
                  {users.roleDistribution.map((role, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{role._id}</span>
                      <span className="text-sm font-medium text-gray-900">{role.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-sm font-medium text-gray-900">{users.activityStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="text-sm font-medium text-green-600">{users.activityStats.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Inactive Users</span>
                    <span className="text-sm font-medium text-red-600">{users.activityStats.inactive}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && notifications && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Type Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
                <div className="space-y-3">
                  {notifications.typeDistribution.map((type, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{type._id.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium text-gray-900">{type.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Read Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Notifications</span>
                    <span className="text-sm font-medium text-gray-900">{notifications.readStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Read</span>
                    <span className="text-sm font-medium text-green-600">{notifications.readStats.read}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unread</span>
                    <span className="text-sm font-medium text-red-600">{notifications.readStats.unread}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Distribution</h3>
              <div className="space-y-3">
                {notifications.priorityDistribution.map((priority, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{priority._id}</span>
                    <span className="text-sm font-medium text-gray-900">{priority.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
