const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'doctor', 'patient'],
    default: 'patient'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.role !== 'superadmin' && this.role !== 'patient';
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  medicalHistory: [{
    condition: { type: String, required: true },
    diagnosisDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'resolved', 'chronic'], default: 'active' },
    notes: String
  }],
  allergies: [{
    allergen: { type: String, required: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
    notes: String
  }],
  currentMedications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    prescribedBy: String
  }],
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema); 