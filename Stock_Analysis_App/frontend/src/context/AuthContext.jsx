import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/auth.js'

const AuthContext = createContext(null)

// Derive a normalised roles array from a user object.
// The new backend returns user.roleName (single string).
// The old backend returned user.roles (array). We support both.
function getRoles(user) {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles
  if (user.roleName) return [user.roleName]
  return []
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authService.getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.clear()
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // only on mount

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials)
    const { accessToken, refreshToken, user: userData } = res.data
    localStorage.setItem('jwt_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token')
    try {
      if (rt) await authService.logout(rt)
    } catch (_) {}
    localStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  const userRoles = getRoles(user)

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: userRoles.includes('ADMIN'),
    isTrader: userRoles.includes('TRADER'),
    isViewer: userRoles.includes('VIEWER'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
