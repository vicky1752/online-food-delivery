import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('foodie_token')
    const savedUser = localStorage.getItem('foodie_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenVal, userData) => {
    setToken(tokenVal)
    setUser(userData)
    localStorage.setItem('foodie_token', tokenVal)
    localStorage.setItem('foodie_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('foodie_token')
    localStorage.removeItem('foodie_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
