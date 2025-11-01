import React, { useEffect, useMemo, useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Loader2,
  Mail,
  Phone,
  Edit3,
  Power,
  X
} from 'lucide-react';

const initialAddForm = (adminUser) => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  emergencyContact: {
    name: adminUser?.name || '',
    phone: adminUser?.phone || '',
    relationship: 'Clinic Admin'
  }
});

const initialEditForm = {
  name: '',
  email: '',
  phone: '',
  isActive: true
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
  }`}>
    {isActive ? (
      <>
        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Active
      </>
    ) : (
      <>
        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Inactive
      </>
    )}
  </span>
);

const ManageDoctors = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addForm, setAddForm] = useState(initialAddForm(user));
  const [editForm, setEditForm] = useState(initialEditForm);
  const [activeDoctor, setActiveDoctor] = useState(null);

  useEffect(() => {
    if (user?.organizationId) {
      fetchDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.list({
        organizationId: user.organizationId,
        role: 'doctor',
        includeInactive: true
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.users)
          ? res.data.users
          : [];
      setDoctors(list);
    } catch (error) {
      console.error('Fetch doctors error:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = doctors.length;
    const active = doctors.filter((d) => d.isActive).length;
    const inactive = total - active;
    const recent = doctors.filter((d) => {
      if (!d.createdAt) return false;
      const created = new Date(d.createdAt);
      const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, active, inactive, recent };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch = search
        ? [doctor.name, doctor.email, doctor.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search.toLowerCase()))
        : true;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? doctor.isActive
            : !doctor.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [doctors, search, statusFilter]);

  const resetAddForm = () => {
    setAddForm(initialAddForm(user));
  };

  const handleAddFormChange = (field, value, nested = null) => {
    if (nested) {
      setAddForm((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setAddForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const openEditModal = (doctor) => {
    setActiveDoctor(doctor);
    setEditForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      isActive: doctor.isActive !== false
    });
    setShowEditModal(true);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!user?.organizationId) {
      toast.error('Organization context not found');
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...addForm,
        organizationId: user.organizationId,
        role: 'doctor'
      };
      delete payload.confirmPassword;
      await usersAPI.create(payload);
      toast.success('Doctor created successfully');
      setShowAddModal(false);
      resetAddForm();
      fetchDoctors();
    } catch (error) {
      console.error('Create doctor error:', error);
      toast.error(error.response?.data?.message || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDoctor = async (e) => {
    e.preventDefault();
    if (!activeDoctor) return;

    setSaving(true);
    try {
      await usersAPI.update(activeDoctor._id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        isActive: editForm.isActive
      });
      toast.success('Doctor updated successfully');
      setShowEditModal(false);
      setActiveDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error('Update doctor error:', error);
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctorStatus = async (doctor) => {
    try {
      await usersAPI.update(doctor._id, { isActive: !doctor.isActive });
      toast.success(`Doctor ${doctor.isActive ? 'deactivated' : 'reactivated'}`);
      fetchDoctors();
    } catch (error) {
      console.error('Toggle doctor status error:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Add, update and monitor the doctors associated with your clinic.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="btn-primary inline-flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Doctor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Doctors" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Active" value={stats.active} icon={ShieldCheck} color="green" />
        <StatCard title="Inactive" value={stats.inactive} icon={ShieldAlert} color="red" />
        <StatCard title="New (30d)" value={stats.recent} icon={UserPlus} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors by name, email or phone"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="btn-secondary inline-flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No doctors found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{doctor.name}</span>
                        <span className="text-xs text-gray-500 capitalize">{doctor.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center"><Mail className="h-3.5 w-3.5 mr-2 text-gray-400" /> {doctor.email}</div>
                        <div className="flex items-center"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" /> {doctor.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge isActive={doctor.isActive !== false} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Edit doctor"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleDoctorStatus(doctor)}
                          className={doctor.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                          title={doctor.isActive ? 'Deactivate doctor' : 'Activate doctor'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Doctor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddDoctor} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    className="input-field"
                    value={addForm.name}
                    onChange={(e) => handleAddFormChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={addForm.email}
                    onChange={(e) => handleAddFormChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="input-field"
                    value={addForm.phone}
                    onChange={(e) => handleAddFormChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="input-field"
                    value={addForm.dateOfBirth}
                    onChange={(e) => handleAddFormChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={addForm.password}
                    onChange={(e) => handleAddFormChange('password', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={addForm.confirmPassword}
                    onChange={(e) => handleAddFormChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input-field"
                    placeholder="Street"
                    value={addForm.address.street}
                    onChange={(e) => handleAddFormChange('street', e.target.value, 'address')}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="City"
                    value={addForm.address.city}
                    onChange={(e) => handleAddFormChange('city', e.target.value, 'address')}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="State"
                    value={addForm.address.state}
                    onChange={(e) => handleAddFormChange('state', e.target.value, 'address')}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="ZIP Code"
                    value={addForm.address.zipCode}
                    onChange={(e) => handleAddFormChange('zipCode', e.target.value, 'address')}
                    required
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    className="input-field"
                    placeholder="Name"
                    value={addForm.emergencyContact.name}
                    onChange={(e) => handleAddFormChange('name', e.target.value, 'emergencyContact')}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="Phone"
                    value={addForm.emergencyContact.phone}
                    onChange={(e) => handleAddFormChange('phone', e.target.value, 'emergencyContact')}
                    required
                  />
                  <input
                    className="input-field"
                    placeholder="Relationship"
                    value={addForm.emergencyContact.relationship}
                    onChange={(e) => handleAddFormChange('relationship', e.target.value, 'emergencyContact')}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && activeDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Doctor</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditDoctor} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="input-field"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    id="doctor-is-active"
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="doctor-is-active" className="text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDoctors;

