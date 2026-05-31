import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

const features = [
  { icon: '📈', text: 'Log trades with entry, stop-loss & target' },
  { icon: '⚡', text: 'Live price alerts via Yahoo Finance' },
  { icon: '📊', text: 'Win rate, R/R ratio & setup analytics' },
  { icon: '🔍', text: 'Pre-trade analysis with revision history' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/dashboard'
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login({ email: data.email, password: data.password })
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? 'Invalid email or password. Please try again.'
      )
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0b1120 0%, #0d1a35 50%, #0f1f42 100%)',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand shadow-brand-md">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 14l5-5 3.5 3.5 5.5-8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">StockTrack</span>
            <span className="block text-xs text-slate-400 leading-none">Trade Journal Pro</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative">
          <p className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-4">
            Professional Trade Management
          </p>
          <h2 className="text-4xl font-bold text-white leading-[1.15] mb-5" style={{ letterSpacing: '-0.02em' }}>
            Every trade<br />
            tracked &<br />
            <span className="text-brand-300">analyzed.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
            A complete system for serious traders who want data-driven insights on their setups and performance.
          </p>
          <ul className="space-y-3.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom note */}
        <p className="relative text-xs text-slate-600">
          Built for NSE, BSE & NASDAQ traders
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-brand shadow-brand-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12l4-4 3 3 5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">StockTrack</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your trading dashboard</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                })}
              />

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-3">
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full justify-center mt-2"
                loading={isSubmitting}
                size="md"
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-medium hover:underline">
              Create one
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-3">
            Default admin: <span className="font-mono text-slate-500">admin@stockapp.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
