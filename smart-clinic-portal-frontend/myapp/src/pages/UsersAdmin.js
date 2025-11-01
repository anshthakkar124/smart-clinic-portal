import React, { useEffect, useState } from 'react';
import { organizationsAPI, usersAPI } from '../services/api';
import { Users, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersAdmin = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name:'', email:'', phone:'', role:'patient', isActive:true });

  const load = async () => {
    setLoading(true);
    try {
      const orgsRes = await organizationsAPI.getAll();
      const listOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : (orgsRes.data?.organizations || []);
      setOrgs(listOrgs);
      const all = [];
      // fetch users per org
      for (const o of listOrgs) {
        try {
          const ur = await organizationsAPI.getUsers(o._id);
          const users = Array.isArray(ur.data) ? ur.data : (ur.data?.users || []);
          users.forEach(u => all.push({ ...u, organization: o }));
        } catch {
          // skip
        }
      }
      setRows(all);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removeFromOrg = async (orgId, userId) => {
    if (!window.confirm('Remove user from organization?')) return;
    try {
      await organizationsAPI.removeUser(orgId, userId);
      toast.success('User removed from organization');
      load();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const filtered = selectedOrg==='all' ? rows : rows.filter(r => r.organization?._id===selectedOrg);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <div>
          <select className="input-field" value={selectedOrg} onChange={e=>setSelectedOrg(e.target.value)}>
            <option value="all">All Organizations</option>
            {orgs.map(o => (
              <option key={o._id} value={o._id}>{o.name}</option>
            ))}
          </select>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3"/>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((u)=> (
                  <tr key={u._id}>
                    <td className="px-6 py-3 text-sm text-gray-900">{u.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-3 text-sm capitalize">{u.role}</td>
                    <td className="px-6 py-3 text-sm">{u.organization?.name || '-'}</td>
                    <td className="px-6 py-3 text-right text-sm space-x-3">
                      <button onClick={()=>{setEditUser(u); setUserForm({ name:u.name||'', email:u.email||'', phone:u.phone||'', role:u.role||'patient', isActive: u.isActive!==false });}} className="text-indigo-600 hover:text-indigo-800">
                        <Pencil className="h-4 w-4"/>
                      </button>
                      {u.organization?._id && (
                        <button onClick={()=>removeFromOrg(u.organization._id, u._id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={async (e)=>{e.preventDefault(); try { await usersAPI.update(editUser._id, userForm); toast.success('User updated'); setEditUser(null); load(); } catch { toast.error('Failed to update user'); }}} className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>  
            <input className="input-field" placeholder="Name" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input-field" placeholder="Email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input className="input-field" placeholder="Phone" value={userForm.phone} onChange={e=>setUserForm({...userForm,phone:e.target.value})} />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <input type="checkbox" className="mr-2" checked={!!userForm.isActive} onChange={e=>setUserForm({...userForm,isActive:e.target.checked})} />
            </div>
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
export default UsersAdmin;
