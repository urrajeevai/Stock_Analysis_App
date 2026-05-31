import { useState, useEffect } from 'react'
import { listUsers, updateUser, deactivateUser } from '../services/auth.js'
import { listRoles } from '../services/roles.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Modal from '../components/ui/Modal.jsx'
import Badge from '../components/ui/Badge.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ name: '', mobile: '', roleId: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([listUsers(), listRoles()])
      .then(([u, r]) => { setUsers(u.data); setRoles(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openEdit = (user) => {
    setEditUser(user)
    setForm({ name: user.name, mobile: user.mobile || '', roleId: user.roleId || '', password: '' })
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { name: form.name, mobile: form.mobile, roleId: form.roleId || null }
      if (form.password) payload.password = form.password
      await updateUser(editUser.id, payload)
      setEditUser(null)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return
    try { await deactivateUser(userId); load() }
    catch (e) { alert(e.response?.data?.message || 'Failed') }
  }

  const roleVariant = (roleName) => {
    if (roleName === 'ADMIN') return 'danger'
    if (roleName === 'TRADER') return 'info'
    return 'neutral'
  }

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} registered users</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="No users have registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Username', 'Email', 'Mobile', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left label-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors duration-100">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-slate-800">{u.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 font-data">@{u.username}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{u.email}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 font-data">{u.mobile || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={roleVariant(u.roleName)} dot>{u.roleName}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.active ? 'success' : 'neutral'} dot>
                        {u.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-data">
                      {u.createdTime ? new Date(u.createdTime).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(u)}>Edit</Button>
                        {u.active && (
                          <Button variant="ghost" size="xs" className="text-red-500 hover:bg-red-50" onClick={() => handleDeactivate(u.id)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUser && (
        <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Edit ${editUser.username}`}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">{error}</div>
            )}
            <Input
              label="Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Mobile"
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
            />
            <Select
              label="Role"
              value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: Number(e.target.value) }))}
            >
              <option value="">Select Role</option>
              {roles.map(r => (
                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
              ))}
            </Select>
            <Input
              label="New Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Leave blank to keep current"
              hint="Only fill this to change the password"
            />
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setEditUser(null)} className="flex-1 justify-center">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1 justify-center">Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
