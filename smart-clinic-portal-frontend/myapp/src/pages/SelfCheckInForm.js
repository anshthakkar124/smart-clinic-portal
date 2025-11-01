import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { selfCheckInAPI, appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Pill,
  Brain,
  Coffee,
  Moon,
  Cigarette,
  Wine,
  Zap,
  Save,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';

const SelfCheckInForm = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riskLevel, setRiskLevel] = useState('low');
  const [recommendations, setRecommendations] = useState([]);

  const totalSteps = 6;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      // Basic Info
      basicInfo: {
        currentSymptoms: [{ symptom: '', severity: 'mild', duration: '', notes: '' }],
        currentMedications: [{ name: '', dosage: '', frequency: '', startDate: '' }],
        allergies: [{ allergen: '', reaction: '', severity: 'mild' }],
        medicalHistory: [{ condition: '', diagnosisDate: '', status: 'active', notes: '' }]
      },
      
      // Vital Signs
      vitalSigns: {
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: { value: '' },
        temperature: { value: '' },
        weight: { value: '' },
        height: { value: '' },
        oxygenSaturation: { value: '' }
      },
      
      // COVID Screening
      covidScreening: {
        hasSymptoms: false,
        symptoms: [],
        hasBeenExposed: false,
        exposureDetails: '',
        hasTestedPositive: false,
        lastTestDate: '',
        isVaccinated: false,
        vaccinationDetails: [{ vaccineType: '', doseNumber: '', vaccinationDate: '' }],
        travelHistory: {
          hasTraveled: false,
          travelDetails: '',
          travelDates: { departure: '', return: '' }
        }
      },
      
      // Mental Health
      mentalHealth: {
        moodRating: 5,
        anxietyLevel: 5,
        sleepQuality: 5,
        stressLevel: 5,
        hasMentalHealthConcerns: false,
        mentalHealthNotes: '',
        currentMedications: [{ medication: '', dosage: '', prescribedBy: '' }]
      },
      
      // Lifestyle
      lifestyle: {
        exerciseFrequency: 'none',
        dietQuality: 'fair',
        smokingStatus: 'never',
        alcoholConsumption: 'none',
        sleepHours: 8,
        stressFactors: [],
        stressNotes: ''
      },
      
      // Emergency Info
      emergencyInfo: {
        hasEmergencySymptoms: false,
        emergencySymptoms: [],
        emergencyNotes: '',
        needsImmediateAttention: false
      },
      
      // Additional Info
      additionalInfo: {
        questions: [{ question: '', answer: '', type: 'text' }],
        concerns: '',
        questionsForDoctor: '',
        additionalNotes: ''
      },
      
      // Consent
      consentGiven: false,
      dataSharingConsent: false
    }
  });

  const { fields: symptomFields, append: appendSymptom, remove: removeSymptom } = useFieldArray({
    control,
    name: 'basicInfo.currentSymptoms'
  });

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control,
    name: 'basicInfo.currentMedications'
  });

  const { fields: allergyFields, append: appendAllergy, remove: removeAllergy } = useFieldArray({
    control,
    name: 'basicInfo.allergies'
  });

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await appointmentsAPI.getById(appointmentId);
      setAppointment(response.data);
    } catch (error) {
      toast.error('Failed to fetch appointment details');
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await selfCheckInAPI.create({
        appointmentId,
        ...data
      });
      
      toast.success('Self-check-in completed successfully!');
      navigate(`/self-checkin/${response.data.checkIn._id}`);
    } catch (error) {
      toast.error('Failed to submit self-check-in');
      console.error('Error submitting self-check-in:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRiskLevel = () => {
    const data = getValues();
    let riskScore = 0;
    
    // COVID-19 risk factors
    if (data.covidScreening.hasSymptoms) riskScore += 3;
    if (data.covidScreening.hasBeenExposed) riskScore += 2;
    if (data.covidScreening.hasTestedPositive) riskScore += 4;
    
    // Emergency symptoms
    if (data.emergencyInfo.hasEmergencySymptoms) riskScore += 5;
    if (data.emergencyInfo.needsImmediateAttention) riskScore += 10;
    
    // Mental health concerns
    if (data.mentalHealth.hasMentalHealthConcerns) riskScore += 2;
    if (data.mentalHealth.anxietyLevel > 7) riskScore += 1;
    if (data.mentalHealth.moodRating < 4) riskScore += 1;
    
    // Vital signs
    if (data.vitalSigns.temperature && data.vitalSigns.temperature.value > 100.4) riskScore += 2;
    if (data.vitalSigns.heartRate && (data.vitalSigns.heartRate.value > 100 || data.vitalSigns.heartRate.value < 60)) riskScore += 1;
    if (data.vitalSigns.oxygenSaturation && data.vitalSigns.oxygenSaturation.value < 95) riskScore += 3;
    
    // Determine risk level
    if (riskScore >= 10) return 'critical';
    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Self Health Check-in</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Complete your health assessment before your appointment
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Appointment</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appointment && new Date(appointment.date).toLocaleDateString()} at {appointment?.startTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Basic Health Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Basic Health Information
              </h2>
              
              {/* Current Symptoms */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Symptoms</h3>
                {symptomFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptom</label>
                        <input
                          {...register(`basicInfo.currentSymptoms.${index}.symptom`, { required: 'Symptom is required' })}
                          className="input-field"
                          placeholder="e.g., Headache, Fever, Cough"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                        <select
                          {...register(`basicInfo.currentSymptoms.${index}.severity`)}
                          className="input-field"
                        >
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          {...register(`basicInfo.currentSymptoms.${index}.duration`)}
                          className="input-field"
                          placeholder="e.g., 2 days, 1 week"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeSymptom(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        {...register(`basicInfo.currentSymptoms.${index}.notes`)}
                        className="input-field"
                        rows={2}
                        placeholder="Additional details about this symptom"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendSymptom({ symptom: '', severity: 'mild', duration: '', notes: '' })}
                  className="btn-secondary"
                >
                  Add Symptom
                </button>
              </div>

              {/* Current Medications */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Medications</h3>
                {medicationFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                        <input
                          {...register(`basicInfo.currentMedications.${index}.name`)}
                          className="input-field"
                          placeholder="e.g., Aspirin, Metformin"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          {...register(`basicInfo.currentMedications.${index}.dosage`)}
                          className="input-field"
                          placeholder="e.g., 100mg, 2 tablets"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                          {...register(`basicInfo.currentMedications.${index}.frequency`)}
                          className="input-field"
                          placeholder="e.g., Twice daily, As needed"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendMedication({ name: '', dosage: '', frequency: '', startDate: '' })}
                  className="btn-secondary"
                >
                  Add Medication
                </button>
              </div>

              {/* Allergies */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Allergies</h3>
                {allergyFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergen</label>
                        <input
                          {...register(`basicInfo.allergies.${index}.allergen`)}
                          className="input-field"
                          placeholder="e.g., Penicillin, Peanuts"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reaction</label>
                        <input
                          {...register(`basicInfo.allergies.${index}.reaction`)}
                          className="input-field"
                          placeholder="e.g., Rash, Difficulty breathing"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAllergy(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendAllergy({ allergen: '', reaction: '', severity: 'mild' })}
                  className="btn-secondary"
                >
                  Add Allergy
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Vital Signs */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Vital Signs
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Systolic)</label>
                  <input
                    {...register('vitalSigns.bloodPressure.systolic', { 
                      min: { value: 50, message: 'Invalid systolic pressure' },
                      max: { value: 300, message: 'Invalid systolic pressure' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Diastolic)</label>
                  <input
                    {...register('vitalSigns.bloodPressure.diastolic', { 
                      min: { value: 30, message: 'Invalid diastolic pressure' },
                      max: { value: 200, message: 'Invalid diastolic pressure' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    {...register('vitalSigns.heartRate.value', { 
                      min: { value: 30, message: 'Invalid heart rate' },
                      max: { value: 300, message: 'Invalid heart rate' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                  <input
                    {...register('vitalSigns.temperature.value', { 
                      min: { value: 90, message: 'Invalid temperature' },
                      max: { value: 110, message: 'Invalid temperature' }
                    })}
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                  <input
                    {...register('vitalSigns.weight.value', { 
                      min: { value: 50, message: 'Invalid weight' },
                      max: { value: 1000, message: 'Invalid weight' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                  <input
                    {...register('vitalSigns.height.value', { 
                      min: { value: 24, message: 'Invalid height' },
                      max: { value: 96, message: 'Invalid height' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="68"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                  <input
                    {...register('vitalSigns.oxygenSaturation.value', { 
                      min: { value: 70, message: 'Invalid oxygen saturation' },
                      max: { value: 100, message: 'Invalid oxygen saturation' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="98"
                  />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Note:</p>
                    <p>If you don't have access to these measurements, you can leave them blank. Your doctor will take these measurements during your appointment.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: COVID-19 Screening */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                COVID-19 Screening
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Do you currently have any COVID-19 symptoms?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasSymptoms')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasSymptoms')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Have you been exposed to someone with COVID-19?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasBeenExposed')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasBeenExposed')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Have you tested positive for COVID-19 recently?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasTestedPositive')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.hasTestedPositive')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Are you vaccinated against COVID-19?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.isVaccinated')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('covidScreening.isVaccinated')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Mental Health Assessment */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                Mental Health Assessment
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your current mood? (1 = Very Poor, 10 = Excellent)</label>
                  <input
                    {...register('mentalHealth.moodRating', { 
                      min: { value: 1, message: 'Rating must be at least 1' },
                      max: { value: 10, message: 'Rating must be at most 10' }
                    })}
                    type="range"
                    min="1"
                    max="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1 (Very Poor)</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your anxiety level? (1 = No Anxiety, 10 = Severe Anxiety)</label>
                  <input
                    {...register('mentalHealth.anxietyLevel', { 
                      min: { value: 1, message: 'Rating must be at least 1' },
                      max: { value: 10, message: 'Rating must be at most 10' }
                    })}
                    type="range"
                    min="1"
                    max="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1 (No Anxiety)</span>
                    <span>10 (Severe Anxiety)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your sleep quality? (1 = Very Poor, 10 = Excellent)</label>
                  <input
                    {...register('mentalHealth.sleepQuality', { 
                      min: { value: 1, message: 'Rating must be at least 1' },
                      max: { value: 10, message: 'Rating must be at most 10' }
                    })}
                    type="range"
                    min="1"
                    max="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1 (Very Poor)</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your stress level? (1 = No Stress, 10 = Extreme Stress)</label>
                  <input
                    {...register('mentalHealth.stressLevel', { 
                      min: { value: 1, message: 'Rating must be at least 1' },
                      max: { value: 10, message: 'Rating must be at most 10' }
                    })}
                    type="range"
                    min="1"
                    max="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1 (No Stress)</span>
                    <span>10 (Extreme Stress)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any mental health concerns you'd like to discuss?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('mentalHealth.hasMentalHealthConcerns')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('mentalHealth.hasMentalHealthConcerns')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Mental Health Notes</label>
                  <textarea
                    {...register('mentalHealth.mentalHealthNotes')}
                    className="input-field"
                    rows={3}
                    placeholder="Please share any mental health concerns or notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Lifestyle Factors */}
          {currentStep === 5 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-orange-600" />
                Lifestyle Factors
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How often do you exercise?</label>
                  <select {...register('lifestyle.exerciseFrequency')} className="input-field">
                    <option value="none">No exercise</option>
                    <option value="1-2_times_week">1-2 times per week</option>
                    <option value="3-4_times_week">3-4 times per week</option>
                    <option value="5-6_times_week">5-6 times per week</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you rate your diet quality?</label>
                  <select {...register('lifestyle.dietQuality')} className="input-field">
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Smoking Status</label>
                  <select {...register('lifestyle.smokingStatus')} className="input-field">
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alcohol Consumption</label>
                  <select {...register('lifestyle.alcoholConsumption')} className="input-field">
                    <option value="none">No alcohol</option>
                    <option value="light">Light (1-2 drinks/week)</option>
                    <option value="moderate">Moderate (3-7 drinks/week)</option>
                    <option value="heavy">Heavy (8+ drinks/week)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average hours of sleep per night</label>
                  <input
                    {...register('lifestyle.sleepHours', { 
                      min: { value: 0, message: 'Hours must be at least 0' },
                      max: { value: 24, message: 'Hours must be at most 24' }
                    })}
                    type="number"
                    min="0"
                    max="24"
                    className="input-field"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stress Factors (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['work', 'family', 'financial', 'health', 'relationships', 'other'].map((factor) => (
                      <label key={factor} className="flex items-center">
                        <input
                          {...register('lifestyle.stressFactors')}
                          type="checkbox"
                          value={factor}
                          className="mr-2"
                        />
                        {factor.charAt(0).toUpperCase() + factor.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Lifestyle Notes</label>
                  <textarea
                    {...register('lifestyle.stressNotes')}
                    className="input-field"
                    rows={3}
                    placeholder="Any additional lifestyle information..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Emergency Information & Consent */}
          {currentStep === 6 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Emergency Information & Consent
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any emergency symptoms that require immediate attention?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('emergencyInfo.hasEmergencySymptoms')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('emergencyInfo.hasEmergencySymptoms')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Symptoms (select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['chest_pain', 'severe_headache', 'difficulty_breathing', 'severe_abdominal_pain', 'loss_of_consciousness', 'severe_bleeding', 'high_fever', 'severe_allergic_reaction'].map((symptom) => (
                      <label key={symptom} className="flex items-center">
                        <input
                          {...register('emergencyInfo.emergencySymptoms')}
                          type="checkbox"
                          value={symptom}
                          className="mr-2"
                        />
                        {symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Notes</label>
                  <textarea
                    {...register('emergencyInfo.emergencyNotes')}
                    className="input-field"
                    rows={3}
                    placeholder="Describe any emergency symptoms..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions or Concerns for Your Doctor</label>
                  <textarea
                    {...register('additionalInfo.questionsForDoctor')}
                    className="input-field"
                    rows={3}
                    placeholder="Any questions or concerns you'd like to discuss..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    {...register('additionalInfo.additionalNotes')}
                    className="input-field"
                    rows={3}
                    placeholder="Any additional information..."
                  />
                </div>

                {/* Consent */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Consent</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start">
                      <input
                        {...register('consentGiven', { required: 'Consent is required' })}
                        type="checkbox"
                        className="mt-1 mr-3"
                      />
                      <span className="text-sm text-gray-700">
                        I consent to providing this health information for my medical appointment and understand that this information will be shared with my healthcare provider.
                      </span>
                    </label>
                    
                    <label className="flex items-start">
                      <input
                        {...register('dataSharingConsent', { required: 'Data sharing consent is required' })}
                        type="checkbox"
                        className="mt-1 mr-3"
                      />
                      <span className="text-sm text-gray-700">
                        I consent to the sharing of my health data within the healthcare organization for the purpose of providing medical care.
                      </span>
                    </label>
                  </div>
                  
                  {errors.consentGiven && (
                    <p className="mt-2 text-sm text-red-600">{errors.consentGiven.message}</p>
                  )}
                  {errors.dataSharingConsent && (
                    <p className="mt-2 text-sm text-red-600">{errors.dataSharingConsent.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Check-in
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelfCheckInForm;
