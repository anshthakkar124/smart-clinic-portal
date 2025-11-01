import React, { useState, useEffect } from 'react';
import { prescriptionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Pill,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  User,
  Clock
} from 'lucide-react';

const MyPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, filters]);

  const fetchPrescriptions = async () => {
    try {
      const response = await prescriptionsAPI.getAll({ patientId: user.userId });
      setPrescriptions(response.data.prescriptions);
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    if (filters.status) {
      filtered = filtered.filter(pres => {
        if (filters.status === 'active') {
          return !pres.isDispensed && new Date(pres.expiryDate) > new Date();
        } else if (filters.status === 'expired') {
          return new Date(pres.expiryDate) <= new Date();
        } else if (filters.status === 'dispensed') {
          return pres.isDispensed;
        }
        return true;
      });
    }

    if (filters.date) {
      filtered = filtered.filter(pres => 
        new Date(pres.issueDate).toDateString() === new Date(filters.date).toDateString()
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(pres => 
        pres.doctor?.name?.toLowerCase().includes(searchTerm) ||
        pres.diagnosis?.toLowerCase().includes(searchTerm) ||
        pres.medications?.some(med => med.name.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const downloadPDF = async (prescriptionId) => {
    try {
      // This would typically download the PDF
      toast.success('PDF download would be implemented here');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('Error downloading PDF:', error);
    }
  };

  const getStatusColor = (prescription) => {
    if (prescription.isDispensed) {
      return 'bg-green-100 text-green-800';
    } else if (new Date(prescription.expiryDate) <= new Date()) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (prescription) => {
    if (prescription.isDispensed) {
      return 'Dispensed';
    } else if (new Date(prescription.expiryDate) <= new Date()) {
      return 'Expired';
    } else {
      return 'Active';
    }
  };

  const getStatusIcon = (prescription) => {
    if (prescription.isDispensed) {
      return <CheckCircle className="h-4 w-4" />;
    } else if (new Date(prescription.expiryDate) <= new Date()) {
      return <XCircle className="h-4 w-4" />;
    } else {
      return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your prescriptions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-semibold text-gray-900">{prescriptions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.filter(p => !p.isDispensed && new Date(p.expiryDate) > new Date()).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.filter(p => {
                    const daysUntilExpiry = getDaysUntilExpiry(p.expiryDate);
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !p.isDispensed;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dispensed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.filter(p => p.isDispensed).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search prescriptions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="dispensed">Dispensed</option>
            </select>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="input-field"
            />
            <button 
              onClick={() => setFilters({ status: '', date: '', search: '' })}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Prescriptions ({filteredPrescriptions.length})
            </h3>
          </div>
          
          <div className="overflow-hidden">
            {filteredPrescriptions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => {
                  const daysUntilExpiry = getDaysUntilExpiry(prescription.expiryDate);
                  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !prescription.isDispensed;
                  
                  return (
                    <div key={prescription._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Dr. {prescription.doctor?.name || 'Unknown'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {prescription.organization?.name || 'Unknown Organization'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {new Date(prescription.issueDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {prescription.medications?.length || 0} medications
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {prescription.diagnosis}
                                  </p>
                                  {isExpiringSoon && (
                                    <p className="text-sm text-yellow-600 font-medium">
                                      Expires in {daysUntilExpiry} days
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription)}`}>
                            {getStatusIcon(prescription)}
                            <span className="ml-1">{getStatusText(prescription)}</span>
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setSelectedPrescription(prescription)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button 
                              onClick={() => downloadPDF(prescription._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Medication Preview */}
                      <div className="mt-3 ml-16">
                        <div className="flex flex-wrap gap-2">
                          {prescription.medications?.slice(0, 4).map((med, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              <Pill className="h-3 w-3 mr-1" />
                              {med.name} {med.dosage}
                            </span>
                          ))}
                          {prescription.medications?.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              +{prescription.medications.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Prescription Details
                </h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor and Organization Info */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Doctor Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Name:</strong> Dr. {selectedPrescription.doctor?.name}</p>
                      <p><strong>Organization:</strong> {selectedPrescription.organization?.name}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Prescription Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Issue Date:</strong> {new Date(selectedPrescription.issueDate).toLocaleDateString()}</p>
                      <p><strong>Expiry Date:</strong> {new Date(selectedPrescription.expiryDate).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription)}`}>
                          {getStatusIcon(selectedPrescription)}
                          <span className="ml-1">{getStatusText(selectedPrescription)}</span>
                        </span>
                      </p>
                      {getDaysUntilExpiry(selectedPrescription.expiryDate) > 0 && !selectedPrescription.isDispensed && (
                        <p><strong>Days until expiry:</strong> {getDaysUntilExpiry(selectedPrescription.expiryDate)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Diagnosis and Notes */}
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnosis</h4>
                    <p className="text-sm text-gray-600">{selectedPrescription.diagnosis}</p>
                  </div>

                  {selectedPrescription.notes && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-600">{selectedPrescription.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Medications</h4>
                <div className="space-y-4">
                  {selectedPrescription.medications?.map((med, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{med.name}</h5>
                        <span className="text-sm text-gray-500">{med.dosage}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Frequency:</strong> {med.frequency}</p>
                          {med.quantity && <p><strong>Quantity:</strong> {med.quantity}</p>}
                          {med.refills > 0 && <p><strong>Refills:</strong> {med.refills}</p>}
                        </div>
                        <div>
                          <p><strong>Instructions:</strong> {med.instructions}</p>
                          {med.notes && <p><strong>Notes:</strong> {med.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => downloadPDF(selectedPrescription._id)}
                  className="btn-secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;
