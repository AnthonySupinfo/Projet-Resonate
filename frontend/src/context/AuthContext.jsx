import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getMe, logoutServer } from "../api/auth"

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
    // Applique immédiatement le thème sauvegardé en localStorage
    // avant même que getMe() réponde — évite le flash sombre au refresh
    const savedTheme = localStorage.getItem("theme") || "dark"
    document.documentElement.setAttribute("data-theme", savedTheme)

    const savedToken = localStorage.getItem("token")

    if (!savedToken) {
      setLoading(false)
      return
    }

    getMe()
        .then((userData) => {
          if (!userData) {
            localStorage.removeItem("token")
            localStorage.removeItem("refresh_token")
            setUser(null)
            setToken(null)
            return
          }

          setToken(savedToken)
          setUser(userData)
        })
        .finally(() => setLoading(false))
  }, [])

  // Synchronise le thème BDD -> DOM + localStorage à chaque changement
  useEffect(() => {
    if (!user?.theme) return
    const theme = user.theme
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [user?.theme])

  // Stocke les deux tokens et les infos utilisateur après login
  async function handleLogin(accessToken, refreshToken) {
    localStorage.setItem("token", accessToken)
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken)
    }
    setToken(accessToken)
    const userData = await getMe()
    if (!userData) {
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      setToken(null)
      throw new Error("Token invalide")
    }
    setUser(userData)
  }

  // Déconnexion complète (serveur + client)
  async function logout() {
    await logoutServer()
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("theme")
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
      () => ({ user, setUser, token, loading, handleLogin, logout }),
      [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}