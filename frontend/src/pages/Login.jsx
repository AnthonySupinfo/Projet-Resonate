import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login, loginWithGoogle, loginWithGithub } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import logoResonate from "../../image/Image.png"
import "./Login.css"

const iconGoogle = "/icons/icon.Google.png"
const iconFacebook = "/icons/icon.Facebook.png"
const iconGithub = "/icons/icon.Github.png"

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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [error, setError]               = useState("")
  const [loading, setLoading]           = useState(false)

  const { handleLogin } = useAuth()
  const { t }           = useLanguage()
  const navigate        = useNavigate()

  // Soumission du formulaire - appel API login puis stockage du JWT
  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await login(email, password)
      await handleLogin(data.access_token)
      navigate("/")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      {/* Logo cliquable - retour à l'accueil */}
      <img
        src={logoResonate}
        alt="Logo Resonate"
        className="logo-resonate"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      />

      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t("login.title")}</h1>
          <p className="login-subtitle">{t("login.subtitle")}</p>
        </div>

        {error && <p className="login-error">{error}</p>}

        <form className="login-form" onSubmit={handleSubmit}>

          {/* Champ email */}
          <div className="form-group">
            <label className="form-label">{t("login.email")}</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={e => { setEmail(e.target.value); setError("") }}
                required
              />
              {email.length > 0 && !error && <span className="input-icon"><ValidIcon /></span>}
              {email.length > 0 && error && <span className="input-icon"><ErrorIcon /></span>}
            </div>
          </div>

          {/* Champ mot de passe avec toggle visibilité */}
          <div className="form-group">
            <label className="form-label">{t("login.password")}</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                required
              />
              {password.length > 0 && !error && <span className="input-icon input-icon--with-eye"><ValidIcon /></span>}
              {password.length > 0 && error && <span className="input-icon input-icon--with-eye"><ErrorIcon /></span>}
              <button
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                type="button"
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            <div className="forgot-password">
              <a href="#" className="forgot-link" onClick={e => {
                e.preventDefault()
                navigate("/forgot-password")
              }}>
                {t("login.forgotPassword")}
              </a>
            </div>
          </div>

          <button className="btn-connect" type="submit" disabled={loading}>
            {loading ? t("login.loading") : t("login.submit")}
          </button>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">{t("login.or")}</span>
            <span className="divider-line" />
          </div>

          {/* Connexion sociale - Google, Facebook (désactivé), GitHub */}
          <div className="social-icons">
            <button
              className="social-btn google"
              aria-label={t("login.googleLabel")}
              type="button"
              onClick={loginWithGoogle}
            >
              <img src={iconGoogle} alt="Google" className="social-icon-img" />
            </button>
            <button
              className="social-btn facebook"
              aria-label={t("login.facebookLabel")}
              type="button"
              disabled
              title="Bientôt disponible"
            >
              <img src={iconFacebook} alt="Facebook" className="social-icon-img" />
            </button>
            <button
              className="social-btn github"
              aria-label={t("login.githubLabel")}
              type="button"
              onClick={loginWithGithub}
            >
              <img src={iconGithub} alt="Github" className="social-icon-img" />
            </button>
          </div>

          <p className="register-text">
            {t("login.noAccount")}{" "}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate("/register")}
            >
              {t("login.register")}
            </button>
          </p>

        </form>
      </div>
    </div>
  )
}