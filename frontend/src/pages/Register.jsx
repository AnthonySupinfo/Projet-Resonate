import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { register, login, checkAvailability } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import logoResonate from "../../image/Image.png"
import "./Register.css"

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

// 10 avatars humeurs — l'utilisateur choisit selon son mood
// https://www.dicebear.com/styles/avataaars-neutral/
const AVATARS = [
  { id: 1,  name: "Heureux",      seed: "happy",      bg: "ffdfbf" },
  { id: 2,  name: "Motivé",       seed: "smileTeeth", bg: "ffd5dc" },
  { id: 3,  name: "Cool",         seed: "shades",     bg: "b6e3f4" },
  { id: 4,  name: "Amoureux",     seed: "love",       bg: "f8bbd0" },
  { id: 5,  name: "Fatigué",      seed: "sad",        bg: "c0aede" },
  { id: 6,  name: "Malade",       seed: "sick",       bg: "fff9c4" },
  { id: 7,  name: "Mystérieux",   seed: "mystery",    bg: "d1d4f9" },
  { id: 8,  name: "Détendu",      seed: "chill",      bg: "c8e6c9" },
  { id: 9,  name: "Énergique",    seed: "energetic",  bg: "ffcc80" },
  { id: 10, name: "Pensif",       seed: "pensive",    bg: "e1bee7" },
]

function getAvatarUrl(seed, bg) {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}&backgroundColor=${bg}`
}

export default function Register() {
  const [step, setStep]                   = useState(1)
  const [username, setUsername]           = useState("")
  const [email, setEmail]                 = useState("")
  const [password, setPassword]           = useState("")
  const [confirm, setConfirm]             = useState("")
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [firstName, setFirstName]         = useState("")
  const [lastName, setLastName]           = useState("")
  const [birthDay, setBirthDay]             = useState("")
  const [birthMonth, setBirthMonth]         = useState("")
  const [birthYear, setBirthYear]           = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [error, setError]                 = useState("")
  const [fieldError, setFieldError]       = useState(null)
  const [loading, setLoading]             = useState(false)

  const { handleLogin }  = useAuth()
  const { t, lang }      = useLanguage()
  const navigate         = useNavigate()

  const months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { month: "long" }).format(new Date(2000, i, 1))
  )
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - 13 - i)

  const has6chars  = password.length >= 6
  const has2digits = (password.match(/\d/g) || []).length >= 2
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`'";:]/.test(password)
  const passwordMeetsRequirements = has6chars && has2digits && hasSpecial

  // Validation locale avant de passer à l'étape 2
  async function handleStep1(e) {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setFieldError("confirm"); setError(t("register.errorPasswordMatch")); return }
    setLoading(true)
    try {
      await checkAvailability(email, username)
      setStep(2)
    } catch (err) {
      const msg = err.message
      if (msg.includes("email")) setFieldError("email")
      else if (msg.includes("identifiant")) setFieldError("username")
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Création du compte avec toutes les infos puis connexion automatique
  const step2Ready = lastName.trim() && firstName.trim() && birthDay && birthMonth && birthYear

  async function handleStep2(e) {
    e.preventDefault()
    setError("")
    if (!step2Ready) { setError(t("register.errorStep2Required")); return }
    setLoading(true)
    try {
      const avatarUrl = selectedAvatar
        ? getAvatarUrl(selectedAvatar.seed, selectedAvatar.bg)
        : null
      const birthDate = (birthDay && birthMonth && birthYear)
        ? `${birthYear}-${String(Number(birthMonth)).padStart(2, "0")}-${String(Number(birthDay)).padStart(2, "0")}`
        : null
      await register(email, username, password, firstName, lastName, birthDate, avatarUrl)
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
    <div className="register-wrapper">
      {/* Logo cliquable - retour à l'accueil */}
      <img src={logoResonate} alt="Logo Resonate" className="register-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />

      <div className="register-card">

        {/* Étape 1 - identifiants */}
        {step === 1 && (
          <>
            <div className="register-header">
              <h1 className="register-title">{t("register.title")}</h1>
              <p className="register-subtitle">{t("register.subtitle1")}</p>
            </div>

            {error && !fieldError && <p className="register-error">{error}</p>}
            {fieldError === "confirm" && <p className="register-error">{error}</p>}

            <form className="register-form" onSubmit={handleStep1}>
              <div className="form-group">
                <label className={`form-label${fieldError === "username" ? " form-label--error" : ""}`}>{t("register.username")}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className={`form-input${fieldError === "username" ? " form-input--error" : ""}`}
                    placeholder={t("register.usernamePlaceholder")}
                    value={username}
                    onChange={e => { setUsername(e.target.value); if (fieldError === "username") { setFieldError(null); setError("") } }}
                    required
                  />
                  {username.length > 0 && fieldError !== "username" && <span className="input-icon"><ValidIcon /></span>}
                  {fieldError === "username" && <span className="input-icon"><ErrorIcon /></span>}
                </div>
              </div>

              <div className="form-group">
                <label className={`form-label${fieldError === "email" ? " form-label--error" : ""}`}>{t("register.email")}</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className={`form-input${fieldError === "email" ? " form-input--error" : ""}`}
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (fieldError === "email") { setFieldError(null); setError("") } }}
                    required
                  />
                  {email.length > 0 && fieldError !== "email" && <span className="input-icon"><ValidIcon /></span>}
                  {fieldError === "email" && <span className="input-icon"><ErrorIcon /></span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("register.password")}</label>
                <div className="input-wrapper">
                  <input type={showPassword ? "text" : "password"} className="form-input" placeholder={t("register.passwordPlaceholder")} value={password} onChange={e => setPassword(e.target.value)} required />
                  {password.length > 0 && passwordMeetsRequirements && <span className="input-icon input-icon--with-eye"><ValidIcon /></span>}
                  {password.length > 0 && !passwordMeetsRequirements && <span className="input-icon input-icon--with-eye"><ErrorIcon /></span>}
                  <button className="eye-toggle" type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {password.length > 0 ? (
                  <ul className="pwd-requirements">
                    <li className={`pwd-req${has6chars  ? " pwd-req--ok" : " pwd-req--fail"}`}>{has6chars  ? "✓" : "✗"} {t("register.req6chars")}</li>
                    <li className={`pwd-req${has2digits ? " pwd-req--ok" : " pwd-req--fail"}`}>{has2digits ? "✓" : "✗"} {t("register.req2digits")}</li>
                    <li className={`pwd-req${hasSpecial ? " pwd-req--ok" : " pwd-req--fail"}`}>{hasSpecial ? "✓" : "✗"} {t("register.req1special")}</li>
                  </ul>
                ) : (
                  <span className="register-hint">{t("register.passwordHint")}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t("register.confirmPassword")}</label>
                <div className="input-wrapper">
                  <input type={showConfirm ? "text" : "password"} className={`form-input${fieldError === "confirm" ? " form-input--error" : ""}`} placeholder={t("register.confirmPlaceholder")} value={confirm} onChange={e => { setConfirm(e.target.value); if (fieldError === "confirm") { setFieldError(null); setError("") } }} required />
                  {confirm.length > 0 && confirm === password && <span className="input-icon input-icon--with-eye"><ValidIcon /></span>}
                  {fieldError === "confirm" && <span className="input-icon input-icon--with-eye"><ErrorIcon /></span>}
                  <button className="eye-toggle" type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              <button className="btn-connect" type="submit" disabled={!passwordMeetsRequirements || loading}>
                {loading ? t("register.loading") : t("register.next")}
              </button>

              <div className="step-dots">
                <span className="step-dot step-dot--active" />
                <span className="step-dot" />
              </div>

              <p className="register-login-text">
                {t("register.alreadyAccount")}{" "}
                <span onClick={() => navigate("/login")} className="register-login-link">{t("register.login")}</span>
              </p>
            </form>
          </>
        )}

        {/* Étape 2 - infos personnelles */}
        {step === 2 && (
          <>
            <div className="register-header">
              <h1 className="register-title">{t("register.title")}</h1>
              <p className="register-subtitle">{t("register.subtitle2")}</p>
            </div>

            {error && <p className="register-error">{error}</p>}

            <form className="register-form" onSubmit={handleStep2}>
              <div className="form-group">
                <label className="form-label">{t("register.lastName")}</label>
                <input type="text" className="form-input" placeholder={t("register.lastNamePlaceholder")} value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">{t("register.firstName")}</label>
                <input type="text" className="form-input" placeholder={t("register.firstNamePlaceholder")} value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">{t("register.birthDate")}</label>
                <div className="birth-row">
                  <select className="birth-select" value={birthDay} onChange={e => setBirthDay(e.target.value)}>
                    <option value="">{t("register.day")}</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select className="birth-select" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                    <option value="">{t("register.month")}</option>
                    {months.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                  <select className="birth-select" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                    <option value="">{t("register.year")}</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("register.avatar")}</label>
                <div className="avatar-picker">
                  <div className="avatar-trigger" onClick={() => setAvatarDropdownOpen(o => !o)}>
                    <img
                      src={selectedAvatar
                        ? getAvatarUrl(selectedAvatar.seed, selectedAvatar.bg)
                        : "https://api.dicebear.com/7.x/fun-emoji/svg?seed=neutral&backgroundColor=d1d5db"}
                      alt="avatar"
                      className="avatar-trigger__img"
                    />
                    <svg className="avatar-trigger__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: avatarDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {avatarDropdownOpen && (
                    <>
                      <div className="avatar-overlay" onClick={() => setAvatarDropdownOpen(false)} />
                      <div className="avatar-dropdown">
                        {AVATARS.map(a => (
                          <div
                            key={a.id}
                            className={`avatar-dropdown__item${selectedAvatar?.id === a.id ? " avatar-dropdown__item--active" : ""}`}
                            onClick={() => { setSelectedAvatar(a); setAvatarDropdownOpen(false) }}
                          >
                            <img src={getAvatarUrl(a.seed, a.bg)} alt={a.name} className="avatar-dropdown__img" />
                            <span>{a.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="register-step2-actions">
                <button type="submit" className="btn-connect" disabled={!step2Ready || loading}>
                  {loading ? t("register.creating") : t("register.validate")}
                </button>
              </div>

              <div className="step-dots">
                <span className="step-dot" style={{ cursor: "pointer" }} onClick={() => setStep(1)} />
                <span className="step-dot step-dot--active" />
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  )
}