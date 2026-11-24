import { useState } from 'react'
import { AuthContext } from './auth.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = async (email) => {
    const normalizedEmail = email.trim()
    const name = normalizedEmail.split('@')[0] || 'demo'
    setUser({ id: 1, name, email: normalizedEmail })
  }

  const logout = () => setUser(null)

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}
