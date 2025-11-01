import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationsAPI, usersAPI } from '../services/api';
import { Building2, Edit, Trash2, Users, Pencil,ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const OrganizationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name:'', email:'', phone:'', role:'patient', isActive:true });

  const [form, setForm] = useState({
    name: '',
    type: 'clinic',
    description: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    contact: { phone: '', email: '', website: '' }
  });

  const load = async () => {
    setLoading(true);
    try {
      const [o, u] = await Promise.all([
        organizationsAPI.getById(id),
        organizationsAPI.getUsers(id)
      ]);
      const orgData = o.data?.organization || o.data;
      setOrg(orgData);
      setForm({
        name: orgData?.name || '',
        type: orgData?.type || 'clinic',
        description: orgData?.description || '',
        address: orgData?.address || { street: '', city: '', state: '', zipCode: '', country: 'USA' },
        contact: orgData?.contact || { phone: '', email: '', website: '' }
      });
      const list = Array.isArray(u.data) ? u.data : (u.data?.users || []);
      setUsers(list);
    } catch {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await organizationsAPI.update(id, form);
      toast.success('Organization updated');
      setShowEdit(false);
      load();
    } catch {
      toast.error('Update failed');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    try {
      await organizationsAPI.delete(id);
      toast.success('Organization deleted');
      setShowDeleteConfirm(false);
      navigate('/organizations');
    } catch {
      toast.error('Delete failed');
    }
  };

  const removeUser = async (userId) => {
    if (!window.confirm('Remove user from this organization?')) return;
    try { await organizationsAPI.removeUser(id, userId); toast.success('User removed'); load(); }
    catch { toast.error('Failed to remove user'); }
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
      {/* Header Card */}
      <button onClick={()=>navigate('/organizations')} className="btn-secondary inline-flex items-center absolute top-16 left-62 mt-1"><ArrowLeft className="h-4 w-4 mr-2"/>Back</button>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
              <p className="text-sm text-gray-600 capitalize">{org?.type}</p>
            </div>
          </div>
          <div className="space-x-2">
            <button onClick={()=>setShowEdit(true)} className="btn-secondary inline-flex items-center"><Edit className="h-4 w-4 mr-2"/>Edit</button>
            <button onClick={()=>setShowDeleteConfirm(true)} className="btn-danger inline-flex items-center"><Trash2 className="h-4 w-4 mr-2"/>Delete</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <div className="font-medium text-gray-900 mb-1">Address</div>
            <div>{org?.address?.street}</div>
            <div>{org?.address?.city}, {org?.address?.state} {org?.address?.zipCode}</div>
            <div>{org?.address?.country}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-1">Contact</div>
            <div>Phone: {org?.contact?.phone || '-'}</div>
            <div>Email: {org?.contact?.email || '-'}</div>
            <div>Website: {org?.contact?.website || '-'}</div>
          </div>
        </div>
        {org?.description && (
          <div className="mt-4 text-gray-700">{org.description}</div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Users className="h-5 w-5 text-primary-600 mr-2"/>
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3"/>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u._id}>
                  <td className="px-6 py-3 text-sm text-gray-900">{u.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{u.email}</td>
                  <td className="px-6 py-3 text-sm capitalize">{u.role}</td>
                  <td className="px-6 py-3 text-right text-sm">
                    <button onClick={()=>{setEditUser(u); setUserForm({ name:u.name||'', email:u.email||'', phone:u.phone||'', role:u.role||'patient', isActive: u.isActive!==false });}} className="text-indigo-600 hover:text-indigo-800 mr-3"><Pencil className="h-4 w-4"/></button>
                    <button onClick={()=>removeUser(u._id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Organization</h3>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="input-field" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                <select className="input-field" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="medical_center">Medical Center</option>
                </select>
                <input className="input-field md:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input className="input-field md:col-span-2" placeholder="Street" value={form.address.street} onChange={e=>setForm({...form,address:{...form.address,street:e.target.value}})} />
                <input className="input-field" placeholder="City" value={form.address.city} onChange={e=>setForm({...form,address:{...form.address,city:e.target.value}})} />
                <input className="input-field" placeholder="State" value={form.address.state} onChange={e=>setForm({...form,address:{...form.address,state:e.target.value}})} />
                <input className="input-field" placeholder="Zip" value={form.address.zipCode} onChange={e=>setForm({...form,address:{...form.address,zipCode:e.target.value}})} />
                <input className="input-field" placeholder="Country" value={form.address.country} onChange={e=>setForm({...form,address:{...form.address,country:e.target.value}})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input className="input-field" placeholder="Phone" value={form.contact.phone} onChange={e=>setForm({...form,contact:{...form.contact,phone:e.target.value}})} />
                <input className="input-field" placeholder="Email" value={form.contact.email} onChange={e=>setForm({...form,contact:{...form.contact,email:e.target.value}})} />
                <input className="input-field" placeholder="Website" value={form.contact.website} onChange={e=>setForm({...form,contact:{...form.contact,website:e.target.value}})} />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={()=>setShowEdit(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving?'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete Organization</h3>
            <p className="text-sm text-gray-600 mt-2">This action cannot be undone. Are you sure you want to delete {org?.name}?</p>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={()=>setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={async (e)=>{e.preventDefault(); try { await usersAPI.update(editUser._id, userForm); toast.success('User updated'); setEditUser(null); load(); } catch { toast.error('Failed to update user'); }}} className="space-y-4">
              <input className="input-field" placeholder="Name" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} />
              <input className="input-field" placeholder="Email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} />
              <input className="input-field" placeholder="Phone" value={userForm.phone} onChange={e=>setUserForm({...userForm,phone:e.target.value})} />
              <select className="input-field" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">SuperAdmin</option>
              </select>
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" className="mr-2" checked={!!userForm.isActive} onChange={e=>setUserForm({...userForm,isActive:e.target.checked})} />
                Active
              </label>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={()=>setEditUser(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetails;


