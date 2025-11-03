import React, { useEffect, useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile: updateProfileCtx } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '', city: '', state: '', zipCode: ''
    },
    emergencyContact: {
      name: '', phone: '', relationship: ''
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await authAPI.getMe();
        const u = res.data?.user || res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).substring(0, 10) : '',
          address: {
            street: u.address?.street || '',
            city: u.address?.city || '',
            state: u.address?.state || '',
            zipCode: u.address?.zipCode || ''
          },
          emergencyContact: {
            name: u.emergencyContact?.name || '',
            phone: u.emergencyContact?.phone || '',
            relationship: u.emergencyContact?.relationship || ''
          }
        });
      } catch (e) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm((p) => ({ ...p, address: { ...p.address, [key]: value } }));
    } else if (name.startsWith('emergencyContact.')) {
      const key = name.split('.')[1];
      setForm((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, [key]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      toast.success('Profile updated');
      if (typeof updateProfileCtx === 'function') {
        updateProfileCtx(form);
      }
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChanging(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={form.name} onChange={onChange} className="input-field" placeholder='Name' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={form.email} onChange={onChange} className="input-field" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} className="input-field" placeholder='Phone' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className="input-field" placeholder='Date of Birth' />
            </div>
          </div>
          <h3 className="mt-6 text-md font-semibold text-gray-900">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <input name="address.street" value={form.address.street} onChange={onChange} className="input-field md:col-span-2" placeholder="Street" />
            <input name="address.city" value={form.address.city} onChange={onChange} className="input-field" placeholder="City" />
            <input name="address.state" value={form.address.state} onChange={onChange} className="input-field" placeholder="State" />
            <input name="address.zipCode" value={form.address.zipCode} onChange={onChange} className="input-field" placeholder="Zip" />
          </div>

          <h3 className="mt-6 text-md font-semibold text-gray-900">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <input name="emergencyContact.name" value={form.emergencyContact.name} onChange={onChange} className="input-field" placeholder="Name" />
            <input name="emergencyContact.phone" value={form.emergencyContact.phone} onChange={onChange} className="input-field" placeholder="Phone" />
            <input name="emergencyContact.relationship" value={form.emergencyContact.relationship} onChange={onChange} className="input-field" placeholder="Relationship" />
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 inline-flex items-center">
              {saving ? (
                <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white inline-block rounded-full" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={changePassword} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Lock className="h-5 w-5 mr-2" /> Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e)=>setPasswordForm(p=>({...p,currentPassword:e.target.value}))} className="input-field" placeholder='Current Password' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e)=>setPasswordForm(p=>({...p,newPassword:e.target.value}))} className="input-field" placeholder='New Password' />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e)=>setPasswordForm(p=>({...p,confirmPassword:e.target.value}))} className="input-field" placeholder='Confirm New Password' />
            </div>
            <button type="submit" disabled={changing} className="btn-secondary w-full disabled:opacity-50">
              {changing ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
