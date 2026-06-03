import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import {
  getProfile,
  updateProfile,
  changeEmail,
  changePassword,
  deleteAccount,
  exportData
} from "../api/auth"
import "./Settings.css"

// 10 avatars emojis (mêmes que Register)
const AVATARS = [
  { id: 1,  name: "Heureux",     emoji: "😄", bg: "#ffdfbf" },
  { id: 2,  name: "Motivé",      emoji: "🔥", bg: "#ffd5dc" },
  { id: 3,  name: "Cool",        emoji: "😎", bg: "#b6e3f4" },
  { id: 4,  name: "Amoureux",    emoji: "🥰", bg: "#f8bbd0" },
  { id: 5,  name: "Fatigué",     emoji: "😴", bg: "#c0aede" },
  { id: 6,  name: "Malade",      emoji: "🤒", bg: "#fff9c4" },
  { id: 7,  name: "Mystérieux",  emoji: "🌙", bg: "#d1d4f9" },
  { id: 8,  name: "Détendu",     emoji: "😌", bg: "#c8e6c9" },
  { id: 9,  name: "Énergique",   emoji: "⚡", bg: "#ffe0b2" },
  { id: 10, name: "Pensif",      emoji: "🤔", bg: "#e1bee7" },
]

// Icône crayon (pour les inputs)
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

export default function Settings() {
  const { user, logout, setUser } = useAuth()
  const { t, lang, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  // Champs profil
  const [firstName, setFirstName]   = useState("")
  const [lastName, setLastName]     = useState("")
  const [birthDate, setBirthDate]   = useState("")
  const [email, setEmail]           = useState("")
  const [bio, setBio]               = useState("")
  const [website, setWebsite]       = useState("")
  const [theme, setTheme]           = useState("dark")
  const [avatarUrl, setAvatarUrl]   = useState("")
  const [username, setUsername]     = useState("")

  // Avatar dropdown
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)

  // Modals
  const [emailModalOpen, setEmailModalOpen]       = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen]     = useState(false)

  // Modal email
  const [newEmail, setNewEmail]                       = useState("")
  const [emailModalPassword, setEmailModalPassword]   = useState("")

  // Modal mot de passe
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Modal suppression
  const [deletePassword, setDeletePassword] = useState("")

  // États
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess]     = useState("")
  const [error, setError]         = useState("")

  // Charge le profil au montage
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile()
        if (profile) {
          setFirstName(profile.first_name || "")
          setLastName(profile.last_name || "")
          setBirthDate(profile.birth_date || "")
          setEmail(profile.email || "")
          setUsername(profile.username || "")
          setBio(profile.bio || "")
          setWebsite(profile.website || "")
          setTheme(profile.theme || "dark")
          setAvatarUrl(profile.avatar_url || "")
        }
      } catch {
        setError(t("settings.errorLoad"))
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Affiche un message succès puis le fait disparaître
  function showSuccess(msg) {
    setSuccess(msg)
    setError("")
    setTimeout(() => setSuccess(""), 3000)
  }

  function showError(msg) {
    setError(msg)
    setSuccess("")
    setTimeout(() => setError(""), 5000)
  }

  // Sauvegarder les modifications du profil
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updatedProfile = await updateProfile({
        first_name: firstName || null,
        last_name: lastName || null,
        birth_date: birthDate || null,
        avatar_url: avatarUrl || null,
        bio: bio || null,
        website: website || null,
        theme: theme
      })

      setUser(updatedProfile)
      showSuccess(t("settings.successMessage"))
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Changer l'email
  async function handleChangeEmail(e) {
    e.preventDefault()
    try {
      const result = await changeEmail(emailModalPassword, newEmail)
      setEmail(result.new_email)
      setEmailModalOpen(false)
      setNewEmail("")
      setEmailModalPassword("")
      showSuccess(t("settings.emailChanged"))
    } catch (err) {
      showError(err.message)
    }
  }

  // Changer le mot de passe
  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showError(t("settings.errorPasswordMatch"))
      return
    }
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordModalOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showSuccess(t("settings.passwordChanged"))
    } catch (err) {
      showError(err.message)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    try {
      await deleteAccount(deletePassword)
      // Nettoie le state React + localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      window.location.href = "/"
    } catch (err) {
      showError(err.message)
    }
  }

  // Export RGPD
  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = "resonate-mes-donnees.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showError(t("settings.errorExport"))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">{t("settings.loading")}</div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-card">

        {/* Header */}
        <div className="settings-top">
          <h1 className="settings-title">{t("settings.modifyProfile")}</h1>
          <span className="settings-username">@{username}</span>
        </div>

        {/* Avatar centré */}
        <div className="settings-avatar-section">
          <div
            className="settings-avatar"
            style={{ backgroundColor: avatarUrl ? "transparent" : "#3d3a4a" }}
            onClick={() => setAvatarDropdownOpen(o => !o)}
          >
            {avatarUrl ? (
              <span className="settings-avatar-emoji">{avatarUrl}</span>
            ) : (
              <span className="settings-avatar-placeholder">👤</span>
            )}
          </div>
          <button type="button" className="settings-avatar-link" onClick={() => setAvatarDropdownOpen(o => !o)}>
            {t("settings.modifyAvatar")} <EditIcon />
          </button>
          {avatarDropdownOpen && (
            <>
              <div className="avatar-overlay" onClick={() => setAvatarDropdownOpen(false)} />
              <div className="avatar-dropdown">
                {AVATARS.map(a => (
                  <div
                    key={a.id}
                    className={`avatar-dropdown__item${avatarUrl === a.emoji ? " avatar-dropdown__item--active" : ""}`}
                    onClick={() => { setAvatarUrl(a.emoji); setAvatarDropdownOpen(false) }}
                  >
                    <div className="avatar-dropdown__circle" style={{ backgroundColor: a.bg }}>
                      <span className="avatar-dropdown__emoji">{a.emoji}</span>
                    </div>
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        {success && <p className="settings-success">{success}</p>}
        {error   && <p className="settings-error">{error}</p>}

        <form className="settings-form" onSubmit={handleSave}>

          {/* Nom + Prénom + Date de naissance */}
          <div className="settings-row settings-row--three">
            <div className="settings-field">
              <label className="settings-label">{t("settings.lastName")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  className="settings-input"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t("settings.lastNamePlaceholder")}
                />
                <span className="settings-input-icon"><EditIcon /></span>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t("settings.firstName")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="text"
                  className="settings-input"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t("settings.firstNamePlaceholder")}
                />
                <span className="settings-input-icon"><EditIcon /></span>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t("settings.birthDate")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="date"
                  className="settings-input"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Email + Mot de passe (lecture seule avec bouton modifier) */}
          <div className="settings-row">
            <div className="settings-field">
              <label className="settings-label">{t("settings.email")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="email"
                  className="settings-input"
                  value={email}
                  readOnly
                />
                <button
                  type="button"
                  className="settings-input-icon settings-input-icon--btn"
                  onClick={() => setEmailModalOpen(true)}
                >
                  <EditIcon />
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t("settings.password")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="password"
                  className="settings-input"
                  value="************"
                  readOnly
                />
                <button
                  type="button"
                  className="settings-input-icon settings-input-icon--btn"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  <EditIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="settings-separator" />

          {/* Bio */}
          <div className="settings-field settings-field--full">
            <label className="settings-label">{t("settings.bio")}</label>
            <div className="settings-input-wrapper">
              <textarea
                className="settings-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t("settings.bioPlaceholder")}
                maxLength={300}
                rows={4}
              />
              <span className="settings-input-icon settings-input-icon--top"><EditIcon /></span>
            </div>
            <span className="settings-char-count">{bio.length}/300</span>
          </div>

          {/* Site web + Thème + Langue */}
          <div className="settings-row settings-row--three">
            <div className="settings-field">
              <label className="settings-label">{t("settings.website")}</label>
              <div className="settings-input-wrapper">
                <input
                  type="url"
                  className="settings-input"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder={t("settings.websitePlaceholder")}
                />
                <span className="settings-input-icon"><EditIcon /></span>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t("settings.themePreferred")}</label>
              <div className="settings-input-wrapper">
                <span className="settings-select-icon">
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
                <select
                  className="settings-input settings-select settings-select--with-icon"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                >
                  <option value="dark">{t("settings.dark")}</option>
                  <option value="light">{t("settings.light")}</option>
                </select>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t("settings.languagePreferred")}</label>
              <div className="settings-input-wrapper">
                <span className="settings-select-icon settings-select-icon--svg">
                  {lang === "fr" ? (
                    <svg width="22" height="22" viewBox="0 0 22 22">
                      <clipPath id="settings-flag-fr">
                        <circle cx="11" cy="11" r="11"/>
                      </clipPath>
                      <g clipPath="url(#settings-flag-fr)">
                        <rect width="8" height="22" fill="#002395"/>
                        <rect x="7" width="8" height="22" fill="#FFFFFF"/>
                        <rect x="14" width="8" height="22" fill="#ED2939"/>
                      </g>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22">
                      <clipPath id="settings-flag-en">
                        <circle cx="11" cy="11" r="11"/>
                      </clipPath>
                      <g clipPath="url(#settings-flag-en)">
                        <rect width="22" height="22" fill="#012169"/>
                        <path d="M0,0 L22,22 M22,0 L0,22" stroke="#fff" strokeWidth="4"/>
                        <path d="M0,0 L22,22 M22,0 L0,22" stroke="#C8102E" strokeWidth="2"/>
                        <path d="M11,0 V22 M0,11 H22" stroke="#fff" strokeWidth="6"/>
                        <path d="M11,0 V22 M0,11 H22" stroke="#C8102E" strokeWidth="4"/>
                      </g>
                    </svg>
                  )}
                </span>
                <select
                  className="settings-input settings-select settings-select--with-icon"
                  value={lang}
                  onChange={() => toggleLanguage()}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bouton sauvegarder centré */}
          <div className="settings-save-row">
            <button type="submit" className="settings-save-btn" disabled={saving}>
              {saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>

        </form>

        <div className="settings-separator" />

        {/* Données personnelles */}
        <div className="settings-data-section">
          <label className="settings-label">{t("settings.myData")}</label>
          <div className="settings-data-actions">
            <button type="button" className="settings-data-btn" onClick={handleExport} disabled={exporting}>
              <DownloadIcon />
              {exporting ? t("settings.exporting") : t("settings.export")}
            </button>
            <button type="button" className="settings-delete-btn" onClick={() => setDeleteModalOpen(true)}>
              <TrashIcon />
              {t("settings.deleteAccount")}
            </button>
          </div>
        </div>

        {/* Footer déconnexion */}
        <div className="settings-footer">
          <button type="button" className="settings-logout" onClick={logout}>
            {t("settings.logout")}
          </button>
        </div>

      </div>

      {/* MODAL EMAIL */}
      {emailModalOpen && (
        <div className="modal-overlay" onClick={() => setEmailModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{t("settings.changeEmail")}</h2>
            <form onSubmit={handleChangeEmail} className="modal-form">
              <div className="settings-field">
                <label className="settings-label">{t("settings.newEmail")}</label>
                <input
                  type="email"
                  className="settings-input"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">{t("settings.currentPassword")}</label>
                <input
                  type="password"
                  className="settings-input"
                  value={emailModalPassword}
                  onChange={e => setEmailModalPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={() => setEmailModalOpen(false)}>
                  {t("settings.cancel")}
                </button>
                <button type="submit" className="modal-btn modal-btn--confirm">
                  {t("settings.confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MOT DE PASSE */}
      {passwordModalOpen && (
        <div className="modal-overlay" onClick={() => setPasswordModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{t("settings.changePassword")}</h2>
            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="settings-field">
                <label className="settings-label">{t("settings.currentPassword")}</label>
                <input
                  type="password"
                  className="settings-input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">{t("settings.newPassword")}</label>
                <input
                  type="password"
                  className="settings-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">{t("settings.confirmPassword")}</label>
                <input
                  type="password"
                  className="settings-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={() => setPasswordModalOpen(false)}>
                  {t("settings.cancel")}
                </button>
                <button type="submit" className="modal-btn modal-btn--confirm">
                  {t("settings.confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title modal-title--danger">{t("settings.deleteAccountConfirm")}</h2>
            <p className="modal-text">{t("settings.deleteAccountWarning")}</p>
            <form onSubmit={handleDeleteAccount} className="modal-form">
              <div className="settings-field">
                <label className="settings-label">{t("settings.currentPassword")}</label>
                <input
                  type="password"
                  className="settings-input"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-btn modal-btn--cancel" onClick={() => setDeleteModalOpen(false)}>
                  {t("settings.cancel")}
                </button>
                <button type="submit" className="modal-btn modal-btn--danger">
                  {t("settings.deleteForever")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}