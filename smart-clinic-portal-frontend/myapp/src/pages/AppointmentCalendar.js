import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AppointmentCalendar = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      let response;
      if (user.role === 'doctor') {
        response = await appointmentsAPI.getAll({ doctorId: user.userId });
      } else if (user.role === 'admin') {
        response = await appointmentsAPI.getAll({ organizationId: user.organizationId });
      } else {
        response = await appointmentsAPI.getAll({ patientId: user.userId });
      }
      
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    return appointments.filter(apt => 
      new Date(apt.date).toDateString() === date.toDateString()
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    return date && date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date) => {
    return date && date.toDateString() === selectedDate.toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Appointment Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">
              View your appointments in calendar format
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((date, index) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const hasAppointments = dayAppointments.length > 0;
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isToday(date) ? 'bg-blue-50 border-blue-300' : ''
                        } ${isSelected(date) ? 'bg-blue-100 border-blue-500' : ''}`}
                        onClick={() => date && setSelectedDate(date)}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isToday(date) ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {date.getDate()}
                            </div>
                            
                            {/* Appointment Indicators */}
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 3).map((apt, aptIndex) => (
                                <div
                                  key={apt._id}
                                  className={`flex items-center space-x-1 p-1 rounded text-xs text-white ${getStatusColor(apt.status)}`}
                                >
                                  {getStatusIcon(apt.status)}
                                  <span className="truncate">
                                    {apt.startTime}
                                  </span>
                                </div>
                              ))}
                              
                              {dayAppointments.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{dayAppointments.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Date Appointments */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-6">
                {selectedDateAppointments.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No appointments scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateAppointments.map((appointment) => (
                      <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status)}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {appointment.startTime} - {appointment.endTime}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>
                              {user.role === 'patient' ? 
                                `Dr. ${appointment.doctor?.name || 'Unknown'}` : 
                                appointment.patient?.name || 'Unknown Patient'
                              }
                            </span>
                          </div>
                          
                          {user.role === 'patient' && (
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              <span>{appointment.organization?.name || 'Unknown Organization'}</span>
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <span className="font-medium">Reason:</span> {appointment.reason}
                          </div>
                          
                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">Scheduled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Cancelled/Rejected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
