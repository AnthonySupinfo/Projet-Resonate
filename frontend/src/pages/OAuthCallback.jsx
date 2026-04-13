import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./OAuthCallback.css"

// Réception du token après redirection depuis le fournisseur OAuth (ex: Google) et connexion automatique 
export default function OAuthCallback() {
  const [status, setStatus] = useState("Connexion OAuth en cours...")
  const { handleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (!token) {
      setStatus("Token manquant")
      setTimeout(() => navigate("/login", { replace: true }), 1200)
      return
    }

    handleLogin(token)
      .then(() => {
        window.location.replace("/")
      })
      .catch(() => {
        setStatus("Impossible de finaliser la connexion")
        setTimeout(() => navigate("/login", { replace: true }), 1200)
      })
  }, [handleLogin, navigate])

  return (
    <div className="oauth-page">
      <div className="oauth-card">{status}</div>
    </div>
  )
}
