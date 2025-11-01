import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  FileText, 
  Stethoscope, 
  Clock, 
  User, 
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    recentPrescriptions: 0,
    checkIns: 0,
    notifications: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate loading data
    setStats({
      upcomingAppointments: 2,
      recentPrescriptions: 1,
      checkIns: 3,
      notifications: 1
    });

    setRecentActivity([
      {
        id: 1,
        type: 'appointment',
        title: 'Appointment with Dr. Smith',
        time: '2:00 PM',
        date: 'Today',
        status: 'upcoming'
      },
      {
        id: 2,
        type: 'prescription',
        title: 'Prescription ready for download',
        time: '10:30 AM',
        date: 'Yesterday',
        status: 'ready'
      },
      {
        id: 3,
        type: 'checkin',
        title: 'Self-check completed',
        time: '9:15 AM',
        date: 'Yesterday',
        status: 'completed'
      }
    ]);
  }, []);

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule a new appointment',
      icon: Calendar,
      link: '/appointments',
      color: 'bg-blue-500'
    },
    {
      title: 'Self Check-in',
      description: 'Complete health assessment',
      icon: Stethoscope,
      link: '/self-check',
      color: 'bg-green-500'
    },
    {
      title: 'View Prescriptions',
      description: 'Download your prescriptions',
      icon: FileText,
      link: '/prescriptions',
      color: 'bg-purple-500'
    },
    {
      title: 'Update Profile',
      description: 'Manage your information',
      icon: User,
      link: '/profile',
      color: 'bg-orange-500'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your healthcare today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Prescriptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentPrescriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Stethoscope className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Check-ins This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.checkIns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Notifications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.notifications}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className={`${action.color} p-2 rounded-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/appointments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.time} • {activity.date}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
          <Link
            to="/appointments"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. Sarah Johnson</p>
                <p className="text-xs text-gray-500">General Checkup</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Today, 2:00 PM</p>
              <p className="text-xs text-gray-500">30 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. Michael Chen</p>
                <p className="text-xs text-gray-500">Follow-up Visit</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Tomorrow, 10:30 AM</p>
              <p className="text-xs text-gray-500">45 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
