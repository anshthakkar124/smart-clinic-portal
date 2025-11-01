const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  clinic: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic',
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  status: { 
    type: String, 
    enum: ['checked-in', 'waiting', 'in-consultation', 'completed', 'cancelled'], 
    default: 'checked-in' 
  },
  symptoms: [{
    symptom: { type: String, required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    duration: String,
    notes: String
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  currentMedications: [{
    name: String,
    dosage: String,
    lastTaken: Date
  }],
  allergies: [String],
  medicalHistory: [String],
  chiefComplaint: {
    type: String,
    required: true,
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
  },
  assignedStaff: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  staffNotes: { 
    type: String,
    maxlength: [1000, 'Staff notes cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 30
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpNotes: String
}, {
  timestamps: true
});

// Index for efficient queries
CheckInSchema.index({ patient: 1, createdAt: -1 });
CheckInSchema.index({ clinic: 1, status: 1 });
CheckInSchema.index({ checkInTime: -1 });

// Method to calculate wait time
CheckInSchema.methods.calculateWaitTime = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return 0;
  }
  
  const now = new Date();
  const waitTime = Math.floor((now - this.checkInTime) / (1000 * 60)); // in minutes
  return waitTime;
};

// Method to check if patient is still waiting
CheckInSchema.methods.isWaiting = function() {
  return ['checked-in', 'waiting', 'in-consultation'].includes(this.status);
};

// Virtual for total check-in duration
CheckInSchema.virtual('duration').get(function() {
  if (!this.checkOutTime) return null;
  
  const duration = Math.floor((this.checkOutTime - this.checkInTime) / (1000 * 60)); // in minutes
  return duration;
});

module.exports = mongoose.model('CheckIn', CheckInSchema); 