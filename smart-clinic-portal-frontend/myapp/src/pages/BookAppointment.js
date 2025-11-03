import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { organizationsAPI, appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const BookAppointment = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const reason = watch('reason');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchDoctors();
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsAPI.getAll({ limit: 50 });
      setOrganizations(response.data.organizations);
    } catch (error) {
      toast.error('Failed to fetch healthcare providers');
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await organizationsAPI.getUsers(selectedOrganization._id);
      const doctors = response.data.users.filter(user => user.role === 'doctor');
      setDoctors(doctors);
    } catch (error) {
      toast.error('Failed to fetch doctors');
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await appointmentsAPI.getAvailableSlots(selectedDoctor._id, selectedDate);
      const slots = (res.data?.availableSlots || []).map((t) => ({ time: t, available: true }));
      setAvailableSlots(slots);
    } catch (error) {
      toast.error('Failed to fetch available slots');
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const generateTimeSlots = (date, organization) => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = organization?.settings?.appointmentDuration || 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTime = new Date();
        endTime.setHours(hour, minute + slotDuration, 0, 0);
        const endTimeString = endTime.toTimeString().slice(0, 5);

        slots.push({
          time: timeString,
          endTime: endTimeString,
          available: Math.random() > 0.3 // Simulate availability
        });
      }
    }

    return slots;
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || org.type === selectedType;
    const matchesCity = !selectedCity || org.address.city.toLowerCase().includes(selectedCity.toLowerCase());
    
    return matchesSearch && matchesType && matchesCity;
  });

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const onSubmit = async (data) => {
    if (!selectedOrganization || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please select all required fields');
      return;
    }

    try {
      const appointmentData = {
        organization: selectedOrganization._id,
        doctor: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: data.reason,
        type: 'consultation'
      };

      await appointmentsAPI.create(appointmentData);
      toast.success('Appointment booked successfully! You will receive a confirmation once approved.');
      
      // Reset form
      setSelectedOrganization(null);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setValue('reason', '');
      
    } catch (error) {
      toast.error('Failed to book appointment');
      console.error('Error booking appointment:', error);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Find and book appointments with healthcare providers
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Organization Selection */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Find Healthcare Provider</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search providers..."
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

            {/* Organizations List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Healthcare Providers</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredOrganizations.map((org) => (
                  <div 
                    key={org._id} 
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedOrganization?._id === org._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedOrganization(org)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">{org.name}</h4>
                            <p className="text-sm text-gray-500">{org.description}</p>
                            <div className="flex items-center mt-2">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500">
                                {org.address.city}, {org.address.state}
                              </span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-sm text-blue-600 font-medium capitalize">
                                {org.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedOrganization?._id === org._id && (
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Book Your Appointment</h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Selected Organization */}
                {selectedOrganization && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedOrganization.name}</p>
                        <p className="text-xs text-gray-500">{selectedOrganization.address.city}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor Selection */}
                {selectedOrganization && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor
                    </label>
                    <select
                      value={selectedDoctor?._id || ''}
                      onChange={(e) => {
                        const doctor = doctors.find(d => d._id === e.target.value);
                        setSelectedDoctor(doctor);
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">Choose a doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Selection */}
                {selectedDoctor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {getNextAvailableDates().map((date) => (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            selectedDate === date.toISOString().split('T')[0]
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Time
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading slots...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`p-2 text-sm rounded-lg border transition-colors ${
                              selectedTime === slot.time
                                ? 'bg-blue-500 text-white border-blue-500'
                                : slot.available
                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason for Visit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit *
                  </label>
                  <textarea
                    {...register('reason', {
                      required: 'Please provide a reason for your visit',
                      minLength: {
                        value: 10,
                        message: 'Reason must be at least 10 characters'
                      }
                    })}
                    rows={3}
                    className={`input-field ${errors.reason ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Describe your symptoms or reason for the appointment..."
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedOrganization || !selectedDoctor || !selectedDate || !selectedTime || !reason}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </button>
              </form>

              {/* Booking Summary */}
              {selectedOrganization && selectedDoctor && selectedDate && selectedTime && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Appointment Summary</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>Provider:</strong> {selectedOrganization.name}</p>
                    <p><strong>Doctor:</strong> Dr. {selectedDoctor.name}</p>
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
