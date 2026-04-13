import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getMe } from "../api/auth"

// Contexte d'authentification pour gérer l'état de connexion de l'utilisateur à travers l'application
const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charge le token et les infos utilisateur au montage du composant
  useEffect(() => {
    const savedToken = localStorage.getItem("token")

    if (!savedToken) {
      setLoading(false)
      return
    }

    getMe(savedToken)
      .then((userData) => {
        if (!userData) {
          localStorage.removeItem("token")
          setUser(null)
          setToken(null)
          return
        }

        setToken(savedToken)
        setUser(userData)
      })
      .finally(() => setLoading(false))
  }, [])

  // Stocke le token et les infos utilisateur après login
  async function handleLogin(accessToken) {
    localStorage.setItem("token", accessToken)
    setToken(accessToken)
    const userData = await getMe(accessToken)
    if (!userData) {
      // Token invalide — on nettoie tout
      localStorage.removeItem("token")
      setToken(null)
      throw new Error("Token invalide")
    }
    setUser(userData)
  }

  // Supprime le token et les infos utilisateur
  function logout() {
    localStorage.removeItem("token")
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({ user, token, loading, handleLogin, logout }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
