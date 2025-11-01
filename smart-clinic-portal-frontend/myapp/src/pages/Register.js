import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { organizationsAPI } from '../services/api';
import { Loader } from '../components/Loader';
import { Stethoscope, Eye, EyeOff, CheckCircle, Building2 } from 'lucide-react';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm();

  const password = watch('password');
  const selectedRole = watch('role');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedRole && selectedRole !== 'patient') {
      fetchOrganizations();
    }
  }, [selectedRole]);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await organizationsAPI.getAll();
      setOrganizations(response.data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError('root', {
        type: 'manual',
        message: result.error
      });
    }
  };

  if (loading) {
    return <Loader text="Creating your account..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Stethoscope className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                {...register('name', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                autoComplete="name"
                className={`mt-1 input-field ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                autoComplete="email"
                className={`mt-1 input-field ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Invalid phone number'
                  }
                })}
                type="tel"
                autoComplete="tel"
                className={`mt-1 input-field ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                {...register('dateOfBirth', {
                  required: 'Date of birth is required'
                })}
                type="date"
                className={`mt-1 input-field ${errors.dateOfBirth ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>
          </div>

          {/* Role and Organization Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Account Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Account Type *
                </label>
                <select
                  {...register('role', {
                    required: 'Account type is required'
                  })}
                  className={`mt-1 input-field ${errors.role ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  <option value="">Select account type</option>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Clinic Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {selectedRole && selectedRole !== 'patient' && (
                <div>
                  <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                    Healthcare Organization *
                  </label>
                  {loadingOrgs ? (
                    <div className="mt-1 flex items-center justify-center py-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading organizations...</span>
                    </div>
                  ) : (
                    <select
                      {...register('organizationId', {
                        required: selectedRole !== 'patient' ? 'Organization is required' : false
                      })}
                      className={`mt-1 input-field ${errors.organizationId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    >
                      <option value="">Select organization</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name} - {org.address.city}, {org.address.state}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.organizationId && (
                    <p className="mt-1 text-sm text-red-600">{errors.organizationId.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  {...register('address.street', {
                    required: 'Street address is required'
                  })}
                  type="text"
                  className={`mt-1 input-field ${errors.address?.street ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter street address"
                />
                {errors.address?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  {...register('address.city', {
                    required: 'City is required'
                  })}
                  type="text"
                  className={`mt-1 input-field ${errors.address?.city ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter city"
                />
                {errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  {...register('address.state', {
                    required: 'State is required'
                  })}
                  type="text"
                  className={`mt-1 input-field ${errors.address?.state ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter state"
                />
                {errors.address?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  {...register('address.zipCode', {
                    required: 'ZIP code is required'
                  })}
                  type="text"
                  className={`mt-1 input-field ${errors.address?.zipCode ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter ZIP code"
                />
                {errors.address?.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                  Contact Name *
                </label>
                <input
                  {...register('emergencyContact.name', {
                    required: 'Emergency contact name is required'
                  })}
                  type="text"
                  className={`mt-1 input-field ${errors.emergencyContact?.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter contact name"
                />
                {errors.emergencyContact?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.emergencyContact.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">
                  Contact Phone *
                </label>
                <input
                  {...register('emergencyContact.phone', {
                    required: 'Emergency contact phone is required',
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  type="tel"
                  className={`mt-1 input-field ${errors.emergencyContact?.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter contact phone"
                />
                {errors.emergencyContact?.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.emergencyContact.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                  Relationship *
                </label>
                <select
                  {...register('emergencyContact.relationship', {
                    required: 'Relationship is required'
                  })}
                  className={`mt-1 input-field ${errors.emergencyContact?.relationship ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
                {errors.emergencyContact?.relationship && (
                  <p className="mt-1 text-sm text-red-600">{errors.emergencyContact.relationship.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          {/* Terms and conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-700">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
