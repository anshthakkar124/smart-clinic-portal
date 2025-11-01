import React, { useEffect, useState } from 'react';
import { organizationsAPI } from '../services/api';
import { Building2, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const OrganizationsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
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
      const res = await organizationsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.organizations || []);
      setItems(list);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({
    name: '', type: 'clinic', description: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    contact: { phone: '', email: '', website: '' }
  }); setShowForm(true); };

  const openEdit = (org) => { setEditing(org._id); setForm({
    name: org.name || '', type: org.type || 'clinic', description: org.description || '',
    address: org.address || { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    contact: org.contact || { phone: '', email: '', website: '' }
  }); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await organizationsAPI.update(editing, form);
      else await organizationsAPI.create(form);
      toast.success(editing ? 'Organization updated' : 'Organization created');
      setShowForm(false); load();
    } catch {
      toast.error('Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Deactivate this organization?')) return;
    try { await organizationsAPI.delete(id); toast.success('Organization deactivated'); load(); }
    catch { toast.error('Failed to deactivate'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center"><Plus className="h-4 w-4 mr-2"/> Add Organization</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((o)=> (
                  <tr key={o._id}>
                    <td className="px-6 py-3 text-sm text-gray-900">{o.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 capitalize">{o.type}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{o.address?.city}</td>
                    <td className="px-6 py-3 text-sm">{o.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-6 py-3 text-right text-sm">
                      <Link to={`/organizations/${o._id}`} className="text-primary-600 hover:text-primary-800 inline-flex items-center">
                        <Eye className="h-4 w-4"/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Organization' : 'Create Organization'}</h3>
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
                <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving?'Saving...':'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsAdmin;


