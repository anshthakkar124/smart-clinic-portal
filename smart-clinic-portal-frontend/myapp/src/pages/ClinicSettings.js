import React, { useEffect, useState } from 'react';
import { organizationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
  Save,
  RefreshCcw
} from 'lucide-react';

const defaultForm = {
  name: '',
  description: '',
  type: 'clinic',
  contact: {
    phone: '',
    email: '',
    website: ''
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  specialties: '',
  services: ''
};

const ClinicSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (user?.organizationId) {
      fetchOrganization();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      if (!user?.organizationId) {
        toast.error('No organization assigned to your account');
        setLoading(false);
        return;
      }
      const res = await organizationsAPI.getById(user.organizationId);
      const org = res.data?.organization;
      setOrganization(org);
      if (org) {
        setForm({
          name: org.name || '',
          description: org.description || '',
          type: org.type || 'clinic',
          contact: {
            phone: org.contact?.phone || '',
            email: org.contact?.email || '',
            website: org.contact?.website || ''
          },
          address: {
            street: org.address?.street || '',
            city: org.address?.city || '',
            state: org.address?.state || '',
            zipCode: org.address?.zipCode || ''
          },
          specialties: Array.isArray(org.specialties) ? org.specialties.join(', ') : '',
          services: Array.isArray(org.services) ? org.services.join(', ') : ''
        });
      } else {
        toast.error('Organization not found');
      }
    } catch (error) {
      console.error('Fetch organization error:', error);
      if (error.response?.status === 404) {
        toast.error('Organization not found. Please contact support.');
      } else {
        toast.error('Failed to load clinic details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value, group) => {
    if (group) {
      setForm((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value
        }
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!organization) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        contact: form.contact,
        address: form.address,
        specialties: form.specialties ? form.specialties.split(',').map((item) => item.trim()).filter(Boolean) : [],
        services: form.services ? form.services.split(',').map((item) => item.trim()).filter(Boolean) : []
      };
      await organizationsAPI.update(organization._id, payload);
      toast.success('Clinic profile updated successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Update organization error:', error);
      toast.error(error.response?.data?.message || 'Failed to update clinic profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
            <p className="text-sm text-gray-500">Update your clinic profile, contact details and services.</p>
          </div>
        </div>
        <button onClick={fetchOrganization} className="btn-secondary inline-flex items-center">
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">General information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic name</label>
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic type</label>
                  <select
                    className="input-field"
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="clinic">Clinic</option>
                    <option value="hospital">Hospital</option>
                    <option value="medical_center">Medical Center</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  className="input-field"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your clinic, specialties and patient experience"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      className="input-field pl-9"
                      value={form.contact.phone}
                      onChange={(e) => handleChange('phone', e.target.value, 'contact')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className="input-field pl-9"
                      value={form.contact.email}
                      onChange={(e) => handleChange('email', e.target.value, 'contact')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="relative">
                    <Globe className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      className="input-field pl-9"
                      value={form.contact.website}
                      onChange={(e) => handleChange('website', e.target.value, 'contact')}
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      className="input-field pl-9"
                      value={form.address.street}
                      onChange={(e) => handleChange('street', e.target.value, 'address')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    className="input-field"
                    value={form.address.city}
                    onChange={(e) => handleChange('city', e.target.value, 'address')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    className="input-field"
                    value={form.address.state}
                    onChange={(e) => handleChange('state', e.target.value, 'address')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code</label>
                  <input
                    className="input-field"
                    value={form.address.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value, 'address')}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialties & Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key specialties</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="e.g. Cardiology, Pediatrics, Dermatology"
                    value={form.specialties}
                    onChange={(e) => handleChange('specialties', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate with commas.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Services offered</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="e.g. Tele-consultation, Walk-in, Lab diagnostics"
                    value={form.services}
                    onChange={(e) => handleChange('services', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate with commas.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save changes
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Live preview</h2>
          <p className="text-sm text-gray-500">This is how your clinic profile appears to staff and patients.</p>
          <div className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Clinic</p>
              <p className="text-lg font-semibold text-gray-900">{form.name || 'Your clinic name'}</p>
              <p className="text-sm text-gray-500 capitalize">{form.type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {form.description || 'Add a description to highlight your expertise and patient experience.'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Contact</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><Phone className="h-3.5 w-3.5 inline mr-2 text-gray-400" /> {form.contact.phone || '—'}</li>
                <li><Mail className="h-3.5 w-3.5 inline mr-2 text-gray-400" /> {form.contact.email || '—'}</li>
                {form.contact.website && (
                  <li><Globe className="h-3.5 w-3.5 inline mr-2 text-gray-400" /> {form.contact.website}</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Location</p>
              <p className="text-sm text-gray-600">
                {[form.address.street, form.address.city, form.address.state, form.address.zipCode]
                  .filter(Boolean)
                  .join(', ') || 'Update your address to help patients find you quickly.'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Specialties</p>
              <p className="text-sm text-gray-600">{form.specialties || 'List your primary specialties here.'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Services</p>
              <p className="text-sm text-gray-600">{form.services || 'Highlight key services your clinic provides.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSettings;

