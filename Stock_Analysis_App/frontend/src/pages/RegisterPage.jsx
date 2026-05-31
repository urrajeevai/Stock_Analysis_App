import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerUser } from '../services/auth.js'
import { listRoles } from '../services/roles.js'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    listRoles().then(r => setRoles(r.data)).catch(() => {})
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    setServerError('')
    try {
      await registerUser(data)
      navigate('/login', { state: { message: 'Registered successfully! Please sign in.' } })
    } catch (e) {
      setServerError(e.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7 justify-center">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-brand shadow-brand-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12l4-4 3 3 5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">StockTrack</span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Create your account</h1>
          <p className="text-sm text-slate-500">Start tracking your trades professionally</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-7">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Full Name"
                placeholder="Rajeev Sharma"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <Input
                label="Username"
                placeholder="rajeev_t"
                error={errors.username?.message}
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Min 3 chars' },
                })}
              />
            </div>
            <Input
              label="Email address"
              type="email"
              placeholder="rajeev@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
              })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
            <Input
              label="Mobile (optional)"
              placeholder="9876543210"
              error={errors.mobile?.message}
              {...register('mobile')}
            />
            <Select
              label="Role"
              error={errors.roleName?.message}
              {...register('roleName', { required: 'Role is required' })}
            >
              <option value="">Select a role</option>
              {roles.map(r => (
                <option key={r.roleId} value={r.roleName}>{r.roleName}</option>
              ))}
            </Select>
            <Button type="submit" loading={loading} className="w-full justify-center mt-1">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
