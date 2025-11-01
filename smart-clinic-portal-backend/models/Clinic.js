const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Clinic name is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    fax: String
  },
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  services: [{
    name: { type: String, required: true },
    description: String,
    duration: Number, // in minutes
    price: Number,
    isActive: { type: Boolean, default: true }
  }],
  specialties: [{
    type: String,
    enum: ['general', 'cardiology', 'dermatology', 'pediatrics', 'orthopedics', 'neurology', 'psychiatry', 'gynecology', 'urology', 'ophthalmology', 'dentistry', 'emergency']
  }],
  staff: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  facilities: [{
    name: { type: String, required: true },
    description: String,
    isAvailable: { type: Boolean, default: true }
  }],
  capacity: {
    maxPatients: { type: Number, default: 50 },
    currentPatients: { type: Number, default: 0 }
  },
  settings: {
    appointmentDuration: { type: Number, default: 30 }, // in minutes
    bufferTime: { type: Number, default: 10 }, // in minutes
    allowOnlineBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    maxAdvanceBooking: { type: Number, default: 30 }, // in days
    minAdvanceBooking: { type: Number, default: 1 } // in hours
  },
  insurance: [{
    provider: { type: String, required: true },
    isAccepted: { type: Boolean, default: true }
  }],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'credit-card', 'debit-card', 'insurance', 'check', 'online']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  logo: String,
  images: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
ClinicSchema.index({ name: 1 });
ClinicSchema.index({ 'address.city': 1, 'address.state': 1 });
ClinicSchema.index({ specialties: 1 });
ClinicSchema.index({ isActive: 1 });

// Method to check if clinic is open
ClinicSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3); // 'mon', 'tue', etc.
  const time = now.toTimeString().slice(0, 5); // 'HH:MM'
  
  const dayHours = this.operatingHours[day];
  if (!dayHours || dayHours.closed) return false;
  
  return time >= dayHours.open && time <= dayHours.close;
};

// Method to get next available appointment time
ClinicSchema.methods.getNextAvailableTime = function() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Simple implementation - in real app, check actual availability
  return tomorrow;
};

// Virtual for full address
ClinicSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

module.exports = mongoose.model('Clinic', ClinicSchema); 