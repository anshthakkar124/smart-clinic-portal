const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['clinic', 'hospital', 'medical_center', 'pharmacy'],
    default: 'clinic'
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
  settings: {
    appointmentDuration: { type: Number, default: 30 }, // in minutes
    bufferTime: { type: Number, default: 10 }, // in minutes
    allowOnlineBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    maxAdvanceBooking: { type: Number, default: 30 }, // in days
    minAdvanceBooking: { type: Number, default: 1 }, // in hours
    timezone: { type: String, default: 'America/New_York' }
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
  subscription: {
    plan: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxUsers: { type: Number, default: 10 },
    maxAppointments: { type: Number, default: 100 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ slug: 1 });
OrganizationSchema.index({ 'address.city': 1, 'address.state': 1 });
OrganizationSchema.index({ specialties: 1 });
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });

// Generate slug before saving
OrganizationSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method to check if organization is open
OrganizationSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const time = now.toTimeString().slice(0, 5);
  
  const dayHours = this.operatingHours[day];
  if (!dayHours || dayHours.closed) return false;
  
  return time >= dayHours.open && time <= dayHours.close;
};

// Method to get next available appointment time
OrganizationSchema.methods.getNextAvailableTime = function() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Simple implementation - in real app, check actual availability
  return tomorrow;
};

// Virtual for full address
OrganizationSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

module.exports = mongoose.model('Organization', OrganizationSchema);
