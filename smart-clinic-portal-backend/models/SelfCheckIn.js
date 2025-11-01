const mongoose = require('mongoose');

const SelfCheckInSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  checkInDate: {
    type: Date,
    default: Date.now
  },
  
  // Basic Health Information
  basicInfo: {
    currentSymptoms: [{
      symptom: { type: String, required: true },
      severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
      duration: { type: String, required: true }, // e.g., "2 days", "1 week"
      notes: String
    }],
    currentMedications: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      startDate: { type: Date, required: true }
    }],
    allergies: [{
      allergen: { type: String, required: true },
      reaction: { type: String, required: true },
      severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true }
    }],
    medicalHistory: [{
      condition: { type: String, required: true },
      diagnosisDate: { type: Date, required: true },
      status: { type: String, enum: ['active', 'resolved', 'chronic'], required: true },
      notes: String
    }]
  },

  // Vital Signs
  vitalSigns: {
    bloodPressure: {
      systolic: { type: Number, min: 50, max: 300 },
      diastolic: { type: Number, min: 30, max: 200 },
      unit: { type: String, default: 'mmHg' }
    },
    heartRate: {
      value: { type: Number, min: 30, max: 300 },
      unit: { type: String, default: 'bpm' }
    },
    temperature: {
      value: { type: Number, min: 90, max: 110 },
      unit: { type: String, default: '°F' }
    },
    weight: {
      value: { type: Number, min: 50, max: 1000 },
      unit: { type: String, default: 'lbs' }
    },
    height: {
      value: { type: Number, min: 24, max: 96 },
      unit: { type: String, default: 'inches' }
    },
    oxygenSaturation: {
      value: { type: Number, min: 70, max: 100 },
      unit: { type: String, default: '%' }
    }
  },

  // COVID-19 Screening
  covidScreening: {
    hasSymptoms: { type: Boolean, required: true },
    symptoms: [{
      type: String,
      enum: ['fever', 'cough', 'shortness_of_breath', 'fatigue', 'body_aches', 'headache', 'loss_of_taste', 'loss_of_smell', 'sore_throat', 'congestion', 'nausea', 'diarrhea']
    }],
    hasBeenExposed: { type: Boolean, required: true },
    exposureDetails: String,
    hasTestedPositive: { type: Boolean, required: true },
    lastTestDate: Date,
    isVaccinated: { type: Boolean, required: true },
    vaccinationDetails: [{
      vaccineType: { type: String, enum: ['Pfizer', 'Moderna', 'Johnson & Johnson', 'AstraZeneca', 'Other'] },
      doseNumber: { type: Number, min: 1, max: 4 },
      vaccinationDate: Date
    }],
    travelHistory: {
      hasTraveled: { type: Boolean, required: true },
      travelDetails: String,
      travelDates: {
        departure: Date,
        return: Date
      }
    }
  },

  // Mental Health Assessment
  mentalHealth: {
    moodRating: { type: Number, min: 1, max: 10, required: true },
    anxietyLevel: { type: Number, min: 1, max: 10, required: true },
    sleepQuality: { type: Number, min: 1, max: 10, required: true },
    stressLevel: { type: Number, min: 1, max: 10, required: true },
    hasMentalHealthConcerns: { type: Boolean, required: true },
    mentalHealthNotes: String,
    currentMedications: [{
      medication: { type: String, required: true },
      dosage: { type: String, required: true },
      prescribedBy: String
    }]
  },

  // Lifestyle Factors
  lifestyle: {
    exerciseFrequency: { type: String, enum: ['none', '1-2_times_week', '3-4_times_week', '5-6_times_week', 'daily'], required: true },
    dietQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'], required: true },
    smokingStatus: { type: String, enum: ['never', 'former', 'current'], required: true },
    alcoholConsumption: { type: String, enum: ['none', 'light', 'moderate', 'heavy'], required: true },
    sleepHours: { type: Number, min: 0, max: 24, required: true },
    stressFactors: [{
      type: String,
      enum: ['work', 'family', 'financial', 'health', 'relationships', 'other']
    }],
    stressNotes: String
  },

  // Emergency Information
  emergencyInfo: {
    hasEmergencySymptoms: { type: Boolean, required: true },
    emergencySymptoms: [{
      type: String,
      enum: ['chest_pain', 'severe_headache', 'difficulty_breathing', 'severe_abdominal_pain', 'loss_of_consciousness', 'severe_bleeding', 'high_fever', 'severe_allergic_reaction']
    }],
    emergencyNotes: String,
    needsImmediateAttention: { type: Boolean, default: false }
  },

  // Assessment Results
  assessmentResults: {
    riskLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'low' 
    },
    recommendations: [String],
    flaggedForReview: { type: Boolean, default: false },
    reviewNotes: String,
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assessmentDate: Date
  },

  // Additional Information
  additionalInfo: {
    questions: [{
      question: { type: String, required: true },
      answer: { type: String, required: true },
      type: { type: String, enum: ['text', 'yes_no', 'multiple_choice', 'rating'], required: true }
    }],
    concerns: String,
    questionsForDoctor: String,
    additionalNotes: String
  },

  // Status and Completion
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'reviewed', 'flagged'],
    default: 'in_progress'
  },
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in minutes
  
  // Privacy and Consent
  consentGiven: { type: Boolean, required: true },
  dataSharingConsent: { type: Boolean, required: true },
  consentDate: { type: Date, default: Date.now },

  // Integration
  integrationData: {
    externalSystemId: String,
    lastSyncDate: Date,
    syncStatus: { type: String, enum: ['pending', 'synced', 'error'], default: 'pending' }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
SelfCheckInSchema.index({ patient: 1, appointment: 1 });
SelfCheckInSchema.index({ organizationId: 1, checkInDate: -1 });
SelfCheckInSchema.index({ status: 1 });
SelfCheckInSchema.index({ 'assessmentResults.riskLevel': 1 });
SelfCheckInSchema.index({ 'assessmentResults.flaggedForReview': 1 });

// Virtual for BMI calculation
SelfCheckInSchema.virtual('bmi').get(function() {
  if (this.vitalSigns.weight && this.vitalSigns.height) {
    const weightKg = this.vitalSigns.weight * 0.453592; // Convert lbs to kg
    const heightM = this.vitalSigns.height * 0.0254; // Convert inches to meters
    return (weightKg / (heightM * heightM)).toFixed(1);
  }
  return null;
});

// Virtual for blood pressure category
SelfCheckInSchema.virtual('bloodPressureCategory').get(function() {
  if (this.vitalSigns.bloodPressure && this.vitalSigns.bloodPressure.systolic && this.vitalSigns.bloodPressure.diastolic) {
    const systolic = this.vitalSigns.bloodPressure.systolic;
    const diastolic = this.vitalSigns.bloodPressure.diastolic;
    
    if (systolic < 120 && diastolic < 80) return 'normal';
    if (systolic < 130 && diastolic < 80) return 'elevated';
    if (systolic < 140 || diastolic < 90) return 'stage1_hypertension';
    if (systolic < 180 || diastolic < 120) return 'stage2_hypertension';
    return 'hypertensive_crisis';
  }
  return null;
});

// Method to calculate risk level
SelfCheckInSchema.methods.calculateRiskLevel = function() {
  let riskScore = 0;
  
  // COVID-19 risk factors
  if (this.covidScreening.hasSymptoms) riskScore += 3;
  if (this.covidScreening.hasBeenExposed) riskScore += 2;
  if (this.covidScreening.hasTestedPositive) riskScore += 4;
  
  // Emergency symptoms
  if (this.emergencyInfo.hasEmergencySymptoms) riskScore += 5;
  if (this.emergencyInfo.needsImmediateAttention) riskScore += 10;
  
  // Mental health concerns
  if (this.mentalHealth.hasMentalHealthConcerns) riskScore += 2;
  if (this.mentalHealth.anxietyLevel > 7) riskScore += 1;
  if (this.mentalHealth.moodRating < 4) riskScore += 1;
  
  // Vital signs
  if (this.vitalSigns.temperature && this.vitalSigns.temperature.value > 100.4) riskScore += 2;
  if (this.vitalSigns.heartRate && (this.vitalSigns.heartRate.value > 100 || this.vitalSigns.heartRate.value < 60)) riskScore += 1;
  if (this.vitalSigns.oxygenSaturation && this.vitalSigns.oxygenSaturation.value < 95) riskScore += 3;
  
  // Determine risk level
  if (riskScore >= 10) return 'critical';
  if (riskScore >= 6) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
};

// Method to generate recommendations
SelfCheckInSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  // COVID-19 recommendations
  if (this.covidScreening.hasSymptoms || this.covidScreening.hasBeenExposed) {
    recommendations.push('Consider COVID-19 testing');
    recommendations.push('Monitor symptoms closely');
  }
  
  // Emergency recommendations
  if (this.emergencyInfo.hasEmergencySymptoms) {
    recommendations.push('Seek immediate medical attention');
    recommendations.push('Consider emergency room visit');
  }
  
  // Mental health recommendations
  if (this.mentalHealth.hasMentalHealthConcerns || this.mentalHealth.anxietyLevel > 7) {
    recommendations.push('Discuss mental health concerns with doctor');
    recommendations.push('Consider mental health resources');
  }
  
  // Vital signs recommendations
  if (this.vitalSigns.temperature && this.vitalSigns.temperature.value > 100.4) {
    recommendations.push('Monitor fever and consider fever-reducing medication');
  }
  
  if (this.vitalSigns.oxygenSaturation && this.vitalSigns.oxygenSaturation.value < 95) {
    recommendations.push('Monitor oxygen levels closely');
  }
  
  // Lifestyle recommendations
  if (this.lifestyle.exerciseFrequency === 'none') {
    recommendations.push('Consider incorporating regular exercise');
  }
  
  if (this.lifestyle.sleepHours < 6) {
    recommendations.push('Improve sleep hygiene and duration');
  }
  
  return recommendations;
};

// Pre-save middleware to calculate risk level and recommendations
SelfCheckInSchema.pre('save', function(next) {
  if (this.isModified('covidScreening') || this.isModified('emergencyInfo') || 
      this.isModified('mentalHealth') || this.isModified('vitalSigns')) {
    
    this.assessmentResults.riskLevel = this.calculateRiskLevel();
    this.assessmentResults.recommendations = this.generateRecommendations();
    
    if (this.assessmentResults.riskLevel === 'critical' || this.assessmentResults.riskLevel === 'high') {
      this.assessmentResults.flaggedForReview = true;
    }
  }
  
  // Calculate completion percentage
  let completedFields = 0;
  let totalFields = 0;
  
  // Count basic info fields
  if (this.basicInfo.currentSymptoms.length > 0) completedFields++;
  totalFields++;
  
  if (this.basicInfo.currentMedications.length > 0) completedFields++;
  totalFields++;
  
  if (this.basicInfo.allergies.length > 0) completedFields++;
  totalFields++;
  
  // Count COVID screening fields
  if (this.covidScreening.hasSymptoms !== undefined) completedFields++;
  totalFields++;
  
  if (this.covidScreening.hasBeenExposed !== undefined) completedFields++;
  totalFields++;
  
  if (this.covidScreening.isVaccinated !== undefined) completedFields++;
  totalFields++;
  
  // Count mental health fields
  if (this.mentalHealth.moodRating) completedFields++;
  totalFields++;
  
  if (this.mentalHealth.anxietyLevel) completedFields++;
  totalFields++;
  
  // Count lifestyle fields
  if (this.lifestyle.exerciseFrequency) completedFields++;
  totalFields++;
  
  if (this.lifestyle.sleepHours) completedFields++;
  totalFields++;
  
  // Count emergency info
  if (this.emergencyInfo.hasEmergencySymptoms !== undefined) completedFields++;
  totalFields++;
  
  this.completionPercentage = Math.round((completedFields / totalFields) * 100);
  
  next();
});

module.exports = mongoose.model('SelfCheckIn', SelfCheckInSchema);
