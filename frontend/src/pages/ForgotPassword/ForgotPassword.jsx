import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../context/LanguageContext.jsx"
import logoResonate from "../../../image/Image.png"
import "./ForgotPassword.css"

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const ValidIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function ForgotPassword() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError]     = useState("")
  const navigate              = useNavigate()
  const { t }                 = useLanguage()

  // Envoie une demande de réinitialisation par email
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      setMessage(data.message)
    } catch {
      setError(t("forgot.errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-wrapper">
      {/* Logo cliquable - retour à l'accueil */}
      <img src={logoResonate} alt="Logo Resonate" className="forgot-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />

      <div className="forgot-card">
        <div className="forgot-header">
          <h1 className="forgot-title">{t("forgot.title")}</h1>
          <p className="forgot-subtitle">{t("forgot.subtitle")}</p>
        </div>

        {message && <p className="forgot-success">{message}</p>}
        {error   && <p className="forgot-error">{error}</p>}

        {/* Formulaire masqué après envoi réussi */}
        {!message && (
          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t("forgot.email")}</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  placeholder={t("forgot.emailPlaceholder")}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError("") }}
                  required
                />
                {email.length > 0 && !error && <span className="input-icon"><ValidIcon /></span>}
                {email.length > 0 && error && <span className="input-icon"><ErrorIcon /></span>}
              </div>
            </div>
            <button className="btn-connect" type="submit" disabled={loading}>
              {loading ? t("forgot.loading") : t("forgot.submit")}
            </button>
          </form>
        )}

        <p className="forgot-back">
          <span onClick={() => navigate("/login")} className="forgot-back-link">
            {t("forgot.backToLogin")}
          </span>
        </p>
      </div>
    </div>
  )
}