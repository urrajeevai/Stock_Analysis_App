import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { listRoles, createRole, updateRole, deleteRole } from '../services/roles.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Badge from '../components/ui/Badge.jsx'

const roleVariant = (name) => {
  if (name === 'ADMIN') return 'danger'
  if (name === 'TRADER') return 'info'
  return 'neutral'
}

const roleDescription = {
  ADMIN: 'Full access — manage users, roles, and all data',
  TRADER: 'Can create and manage trades and analyses',
  VIEWER: 'Read-only access to all data',
}

export default function RolesPage() {
  const { isAdmin } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [roleName, setRoleName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    listRoles().then(r => setRoles(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setRoleName(''); setError(''); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); setRoleName(r.roleName); setError(''); setModalOpen(true) }

  const handleSave = async () => {
    if (!roleName.trim()) { setError('Role name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateRole(editing.roleId, { roleName })
      } else {
        await createRole({ roleName })
      }
      setModalOpen(false)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (roleId) => {
    if (!window.confirm('Delete this role?')) return
    try { await deleteRole(roleId); load() }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Role Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{roles.length} roles configured</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} leftIcon={<PlusIcon className="h-4 w-4" />}>
            Add Role
          </Button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        ) : roles.length === 0 ? (
          <EmptyState title="No roles found" description="Create roles to assign to users." />
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left label-xs">Role</th>
                <th className="px-4 py-3 text-left label-xs">Description</th>
                {isAdmin && <th className="px-4 py-3 text-left label-xs">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {roles.map(r => (
                <tr key={r.roleId} className="hover:bg-slate-50/80 transition-colors duration-100">
                  <td className="px-4 py-4">
                    <Badge variant={roleVariant(r.roleName)} dot size="md">{r.roleName}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {roleDescription[r.roleName] ?? 'Custom role'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(r)}>Edit</Button>
                        <Button variant="ghost" size="xs" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(r.roleId)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Role' : 'New Role'}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">{error}</div>
          )}
          <Input
            label="Role Name"
            placeholder="e.g. ANALYST"
            value={roleName}
            onChange={e => setRoleName(e.target.value.toUpperCase())}
            hint="Use uppercase letters only"
          />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1 justify-center">Cancel</Button>
            <Button onClick={handleSave} loading={saving} className="flex-1 justify-center">
              {editing ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
