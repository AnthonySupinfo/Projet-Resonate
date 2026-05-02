import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../context/LanguageContext.jsx"
import logoResonate from "../../../image/Image.png"
import "./ResetPassword.css"

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

// Icônes pour afficher/masquer le mot de passe
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Page de réinitialisation du mot de passe via un token
export default function ResetPassword() {
  const [password, setPassword]         = useState("")
  const [confirm, setConfirm]           = useState("")
  const [loading, setLoading]           = useState(false)
  const [message, setMessage]           = useState("")
  const [error, setError]               = useState("")
  const [token, setToken]               = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const navigate                        = useNavigate()
  const { t }                           = useLanguage()

  // Récupère le token depuis l'URL au chargement de la page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tk = params.get("token")
    if (!tk) { setError(t("reset.errorInvalidLink")) }
    else { setToken(tk) }
  }, [])

  // Validation et soumission du nouveau mot de passe
  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setMessage("")

    if (password !== confirm) { setError(t("reset.errorMatch")); return }
    if (password.length < 6)  { setError(t("reset.errorLength")); return }
    if ((password.match(/\d/g) || []).length < 2) { setError(t("reset.errorDigits")); return }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`'";:]/.test(password)) { setError(t("reset.errorSpecial")); return }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || t("reset.errorGeneric"))
      } else {
        setMessage(t("reset.successMessage"))
        // Redirige vers le login après 3 secondes
        setTimeout(() => navigate("/login"), 3000)
      }
    } catch {
      setError(t("reset.errorGeneric"))
    } finally {
      setLoading(false)
    }
  }

  const has6chars  = password.length >= 6
  const has2digits = (password.match(/\d/g) || []).length >= 2
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`'";:]/.test(password)
  const passwordMeetsRequirements = has6chars && has2digits && hasSpecial

  return (
    <div className="reset-wrapper">
      {/* Logo cliquable - retour à l'accueil */}
      <img src={logoResonate} alt="Logo Resonate" className="reset-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />

      <div className="reset-card">
        <div className="reset-header">
          <h1 className="reset-title">{t("reset.title")}</h1>
          <p className="reset-subtitle">{t("reset.subtitle")}</p>
        </div>

        {message && (
          <div className="reset-success">
            {message}<br/>
            <small>{t("reset.redirectMessage")}</small>
          </div>
        )}
        {error && <p className="reset-error">{error}</p>}

        {/* Formulaire masqué après succès ou si token invalide */}
        {!message && token && (
          <form className="reset-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t("reset.newPassword")}</label>
              <div className="input-wrapper">
                <input type={showPassword ? "text" : "password"} className="form-input" placeholder={t("reset.newPasswordPlaceholder")} value={password} onChange={e => { setPassword(e.target.value); setError("") }} required />
                {password.length > 0 && passwordMeetsRequirements && <span className="input-icon input-icon--with-eye"><ValidIcon /></span>}
                {password.length > 0 && !passwordMeetsRequirements && <span className="input-icon input-icon--with-eye"><ErrorIcon /></span>}
                <button className="eye-toggle" type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {password.length > 0 ? (
                <ul className="reset-pwd-requirements">
                  <li className={`reset-pwd-req${has6chars  ? " reset-pwd-req--ok" : " reset-pwd-req--fail"}`}>{has6chars  ? "✓" : "✗"} {t("reset.req6chars")}</li>
                  <li className={`reset-pwd-req${has2digits ? " reset-pwd-req--ok" : " reset-pwd-req--fail"}`}>{has2digits ? "✓" : "✗"} {t("reset.req2digits")}</li>
                  <li className={`reset-pwd-req${hasSpecial ? " reset-pwd-req--ok" : " reset-pwd-req--fail"}`}>{hasSpecial ? "✓" : "✗"} {t("reset.req1special")}</li>
                </ul>
              ) : (
                <span className="reset-hint">{t("reset.hint")}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t("reset.confirmPassword")}</label>
              <div className="input-wrapper">
                <input type={showConfirm ? "text" : "password"} className="form-input" placeholder={t("reset.confirmPlaceholder")} value={confirm} onChange={e => { setConfirm(e.target.value); setError("") }} required />
                {confirm.length > 0 && confirm === password && <span className="input-icon input-icon--with-eye"><ValidIcon /></span>}
                {confirm.length > 0 && confirm !== password && <span className="input-icon input-icon--with-eye"><ErrorIcon /></span>}
                <button className="eye-toggle" type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <button className="btn-connect" type="submit" disabled={loading || !passwordMeetsRequirements || confirm !== password}>
              {loading ? t("reset.loading") : t("reset.submit")}
            </button>
          </form>
        )}

        <p className="reset-back">
          <span onClick={() => navigate("/login")} className="reset-back-link">
            {t("reset.backToLogin")}
          </span>
        </p>
      </div>
    </div>
  )
}