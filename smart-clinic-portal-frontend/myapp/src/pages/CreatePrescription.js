import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { prescriptionsAPI, appointmentsAPI, organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  Pill,
  Save,
  Download,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const CreatePrescription = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    defaultValues: {
      patientId: '',
      diagnosis: '',
      medications: [
        {
          name: '',
          dosage: '',
          frequency: '',
          instructions: '',
          quantity: '',
          refills: 0,
          notes: ''
        }
      ],
      notes: '',
      expiryDate: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications'
  });

  const selectedPatientId = watch('patientId');
  const diagnosis = watch('diagnosis');

  useEffect(() => {
    fetchRecentAppointments();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const patient = recentAppointments.find(apt => apt.patient._id === selectedPatientId)?.patient;
      setSelectedPatient(patient);
    }
  }, [selectedPatientId, recentAppointments]);

  const fetchRecentAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll({ 
        doctorId: user.userId,
        status: 'completed',
        limit: 50
      });
      setRecentAppointments(response.data.appointments);
      
      // Extract unique patients
      const uniquePatients = response.data.appointments.reduce((acc, apt) => {
        if (!acc.find(p => p._id === apt.patient._id)) {
          acc.push(apt.patient);
        }
        return acc;
      }, []);
      setPatients(uniquePatients);
    } catch (error) {
      toast.error('Failed to fetch recent appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addMedication = () => {
    append({
      name: '',
      dosage: '',
      frequency: '',
      instructions: '',
      quantity: '',
      refills: 0,
      notes: ''
    });
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const prescriptionData = {
        ...data,
        patientId: data.patientId,
        doctorId: user.userId,
        organizationId: user.organizationId,
        expiryDate: data.expiryDate || expiryDate.toISOString(),
        issueDate: new Date().toISOString()
      };

      const response = await prescriptionsAPI.create(prescriptionData);
      toast.success('Prescription created successfully!');
      
      // Reset form
      reset();
      setSelectedPatient(null);
      
    } catch (error) {
      toast.error('Failed to create prescription');
      console.error('Error creating prescription:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = async () => {
    // This would typically generate and download a PDF
    toast.success('PDF generation would be implemented here');
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
            <h1 className="text-3xl font-bold text-gray-900">Create Prescription</h1>
            <p className="mt-1 text-sm text-gray-500">
              Issue a new prescription for your patient
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 mb-2"
                  />
                </div>
                <select
                  {...register('patientId', { required: 'Please select a patient' })}
                  className={`input-field ${errors.patientId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  <option value="">Choose a patient</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.email}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Patient Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Name:</strong> {selectedPatient.name}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                    <p><strong>Phone:</strong> {selectedPatient.phone}</p>
                    <p><strong>Date of Birth:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnosis</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Diagnosis *
              </label>
              <textarea
                {...register('diagnosis', { required: 'Please provide a diagnosis' })}
                rows={3}
                className={`input-field ${errors.diagnosis ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter the primary diagnosis..."
              />
              {errors.diagnosis && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosis.message}</p>
              )}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Medications</h3>
              <button
                type="button"
                onClick={addMedication}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Medication {index + 1}
                    </h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medication Name *
                      </label>
                      <input
                        {...register(`medications.${index}.name`, { required: 'Medication name is required' })}
                        className={`input-field ${errors.medications?.[index]?.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., Amoxicillin"
                      />
                      {errors.medications?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.medications[index].name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage *
                      </label>
                      <input
                        {...register(`medications.${index}.dosage`, { required: 'Dosage is required' })}
                        className={`input-field ${errors.medications?.[index]?.dosage ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., 500mg"
                      />
                      {errors.medications?.[index]?.dosage && (
                        <p className="mt-1 text-sm text-red-600">{errors.medications[index].dosage.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency *
                      </label>
                      <input
                        {...register(`medications.${index}.frequency`, { required: 'Frequency is required' })}
                        className={`input-field ${errors.medications?.[index]?.frequency ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., Twice daily"
                      />
                      {errors.medications?.[index]?.frequency && (
                        <p className="mt-1 text-sm text-red-600">{errors.medications[index].frequency.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        {...register(`medications.${index}.quantity`)}
                        className="input-field"
                        placeholder="e.g., 30 tablets"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refills
                      </label>
                      <input
                        {...register(`medications.${index}.refills`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="12"
                        className="input-field"
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions *
                      </label>
                      <textarea
                        {...register(`medications.${index}.instructions`, { required: 'Instructions are required' })}
                        rows={2}
                        className={`input-field ${errors.medications?.[index]?.instructions ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="e.g., Take with food, avoid alcohol"
                      />
                      {errors.medications?.[index]?.instructions && (
                        <p className="mt-1 text-sm text-red-600">{errors.medications[index].instructions.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        {...register(`medications.${index}.notes`)}
                        rows={2}
                        className="input-field"
                        placeholder="Any additional notes or warnings..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Expiry Date
                </label>
                <input
                  {...register('expiryDate')}
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to set 30 days from today
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field"
                  placeholder="Any additional instructions or notes for the patient..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Prescription
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={generatePDF}
                  className="btn-secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </button>
              </div>

              <div className="text-sm text-gray-500">
                Prescription will be automatically saved and sent to the patient
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrescription;
