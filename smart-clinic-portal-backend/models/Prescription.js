const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  diagnosis: {
    primary: { type: String, required: true },
    secondary: [String],
    notes: String
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    genericName: String,
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    refills: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    sideEffects: [String],
    warnings: [String]
  }],
  instructions: {
    general: String,
    followUp: String,
    emergency: String
  },
  labTests: [{
    testName: { type: String, required: true },
    instructions: String,
    urgency: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    dueDate: Date
  }],
  imaging: [{
    type: { type: String, required: true },
    bodyPart: { type: String, required: true },
    instructions: String,
    urgency: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
    dueDate: Date
  }],
  followUp: {
    required: { type: Boolean, default: false },
    timeframe: String,
    reason: String,
    instructions: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  validUntil: {
    type: Date,
    required: true,
    default: function () {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days from now
      return date;
    }
  },
  isDigital: {
    type: Boolean,
    default: true
  },
  pdfPath: String,
  qrCode: String,
  signature: {
    doctor: String,
    timestamp: Date
  }
}, {
  timestamps: true
});

// Generate prescription number before saving
PrescriptionSchema.pre('save', function (next) {
  if (!this.prescriptionNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.prescriptionNumber = `RX${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Index for efficient queries
PrescriptionSchema.index({ patient: 1, createdAt: -1 });
PrescriptionSchema.index({ doctor: 1, createdAt: -1 });
PrescriptionSchema.index({ prescriptionNumber: 1 });
PrescriptionSchema.index({ status: 1 });

// Method to check if prescription is valid
PrescriptionSchema.methods.isValid = function () {
  return this.status === 'active' && new Date() <= this.validUntil;
};

// Method to check if prescription is expired
PrescriptionSchema.methods.isExpired = function () {
  return new Date() > this.validUntil;
};

// Virtual for prescription age in days
PrescriptionSchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
