import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizationsAPI, appointmentsAPI, prescriptionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Calendar, 
  FileText, 
  Plus, 
  Search,
  MapPin,
  Clock,
  CheckCircle,
  Star,
  Filter,
  Eye
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0
  });

  useEffect(() => {
    fetchOrganizations();
    fetchAppointments();
    fetchPrescriptions();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsAPI.getAll({ limit: 20 });
      setOrganizations(response.data.organizations);
    } catch (error) {
      toast.error('Failed to fetch organizations');
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll({ page: 1, limit: 10 });
      const list = response.data?.appointments || [];
      setAppointments(list);

      const upcoming = list.filter(apt => 
        new Date(apt.appointmentDate || apt.date) > new Date() && apt.status !== 'cancelled'
      ).length;
      const completed = list.filter(apt => apt.status === 'completed').length;

      setStats(prev => ({
        ...prev,
        totalAppointments: list.length,
        upcomingAppointments: upcoming,
        completedAppointments: completed
      }));
    } catch (error) {
      toast.error('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionsAPI.getAll({ page: 1, limit: 10 });
      const list = response.data?.prescriptions || [];
      setPrescriptions(list);
      setStats(prev => ({ ...prev, totalPrescriptions: list.length }));
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || org.type === selectedType;
    const matchesCity = !selectedCity || org.address.city.toLowerCase().includes(selectedCity.toLowerCase());
    
    return matchesSearch && matchesType && matchesCity;
  });

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
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
              <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {user?.name} - Find healthcare providers and manage your appointments
              </p>
            </div>
            <div className="flex space-x-3">
              <Link to="/my-prescriptions" className="btn-secondary">
                <FileText className="h-4 w-4 mr-2" />
                My Prescriptions
              </Link>
              <Link to="/book-appointment" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={Calendar}
            color="blue"
            subtitle="All time"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingAppointments}
            icon={Clock}
            color="yellow"
            subtitle="Scheduled appointments"
          />
          <StatCard
            title="Completed"
            value={stats.completedAppointments}
            icon={CheckCircle}
            color="green"
            subtitle="Past appointments"
          />
          <StatCard
            title="Prescriptions"
            value={stats.totalPrescriptions}
            icon={FileText}
            color="purple"
            subtitle="Active prescriptions"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Find Healthcare Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="clinic">Clinic</option>
              <option value="hospital">Hospital</option>
              <option value="medical_center">Medical Center</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
            <input
              type="text"
              placeholder="City"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input-field"
            />
            <button className="btn-primary">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Healthcare Organizations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Healthcare Providers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Browse and book appointments with healthcare providers
              </p>
            </div>
            
            <div className="overflow-hidden max-h-96 overflow-y-auto">
              {filteredOrganizations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No healthcare providers found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOrganizations.map((org) => (
                    <div key={org._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-medium text-gray-900">{org.name}</h4>
                              <p className="text-sm text-gray-500">{org.description}</p>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">
                                  {org.address.city}, {org.address.state}
                                </span>
                                <span className="mx-2 text-gray-300">•</span>
                                <span className="text-xs text-blue-600 font-medium capitalize">
                                  {org.type}
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(org.rating?.average || 0)
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                    />
                                  ))}
                                  <span className="ml-1 text-xs text-gray-500">
                                    ({org.rating?.count || 0})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link to="/book-appointment" className="btn-primary text-xs">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your recent and upcoming appointments
              </p>
            </div>
            
            <div className="overflow-hidden">
              {appointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No appointments found</p>
                  <button className="btn-primary mt-4">
                    Book Your First Appointment
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.organization?.name || 'Unknown Organization'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.appointmentDate || appointment.date).toLocaleDateString()} at {appointment.appointmentTime || appointment.startTime}
                              </p>
                              <p className="text-xs text-gray-400">
                                Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.status}
                          </span>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your recent prescriptions and medications
            </p>
          </div>
          
          <div className="overflow-hidden">
            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {prescriptions.slice(0, 5).map((prescription) => (
                  <div key={prescription._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {prescription.medications?.length || 0} medications
                          </p>
                          <p className="text-sm text-gray-500">
                            Dr. {prescription.doctor?.name || 'Unknown Doctor'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prescription.isDispensed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {prescription.isDispensed ? 'Dispensed' : 'Active'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
