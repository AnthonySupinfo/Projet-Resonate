import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"
import { getProfile, updateProfile, exportData } from "../api/auth"
import logoResonate from "../../image/Image.png"
import "./Settings.css"

// Page de paramètres utilisateur
export default function Settings() {
  const { token, logout } = useAuth()
  const { t }             = useLanguage()
  const navigate          = useNavigate()

  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio]             = useState("")
  const [website, setWebsite]     = useState("")
  const [theme, setTheme]         = useState("dark")

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess]     = useState("")
  const [error, setError]         = useState("")

  // Charge le profil au montage du composant
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile()
        if (profile) {
          setAvatarUrl(profile.avatar_url || "")
          setBio(profile.bio || "")
          setWebsite(profile.website || "")
          setTheme(profile.theme || "dark")
        }
      } catch {
        setError(t("settings.errorLoad"))
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [token])

  // Enregistre les modifications du profil
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await updateProfile( {
        avatar_url: avatarUrl || null,
        bio: bio || null,
        website: website || null,
        theme
      })
      setSuccess(t("settings.successMessage"))
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Génère un fichier JSON et le télécharge dans le navigateur (RGPD)
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
      setError(t("settings.errorExport"))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
        <div className="settings-wrapper">
          <div className="settings-loading">{t("settings.loading")}</div>
        </div>
    )
  }

  return (
      <div className={`settings-wrapper ${theme}`}>

        <img
            src={logoResonate}
            alt="Logo Resonate"
            className="settings-logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
        />

        <div className="settings-card">

          <div className="settings-header">
            <h1 className="settings-title">{t("settings.title")}</h1>
            <p className="settings-subtitle">{t("settings.subtitle")}</p>
          </div>

          {success && <p className="settings-success">{success}</p>}
          {error   && <p className="settings-error">{error}</p>}

          <form className="settings-form" onSubmit={handleSave}>

            {/* Avatar */}
            <div className="settings-section">
              <h2 className="settings-section-title">{t("settings.avatar")}</h2>
              <div className="avatar-row">
                <div className="avatar-preview">
                  {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="avatar-img" onError={e => e.target.style.display = "none"} />
                      : <span className="avatar-placeholder">👤</span>
                  }
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t("settings.avatarUrl")}</label>
                  <input
                      type="url"
                      className="form-input"
                      placeholder={t("settings.avatarPlaceholder")}
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* À propos */}
            <div className="settings-section">
              <h2 className="settings-section-title">{t("settings.about")}</h2>
              <div className="form-group">
                <label className="form-label">{t("settings.bio")}</label>
                <textarea
                    className="form-textarea"
                    placeholder={t("settings.bioPlaceholder")}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={300}
                    rows={4}
                />
                <span className="char-count">{bio.length}/300</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t("settings.website")}</label>
                <input
                    type="url"
                    className="form-input"
                    placeholder={t("settings.websitePlaceholder")}
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                />
              </div>
            </div>

            {/* Apparence - Dark / Light mode */}
            <div className="settings-section">
              <h2 className="settings-section-title">{t("settings.appearance")}</h2>
              <div className="theme-toggle">
                <button
                    type="button"
                    className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                >
                  {t("settings.dark")}
                </button>
                <button
                    type="button"
                    className={`theme-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                >
                  {t("settings.light")}
                </button>
              </div>
            </div>

            <button className="btn-save" type="submit" disabled={saving}>
              {saving ? t("settings.saving") : t("settings.save")}
            </button>

          </form>

          {/* Export des données personnelles (RGPD) */}
          <div className="settings-section settings-export">
            <h2 className="settings-section-title">{t("settings.myData")}</h2>
            <p className="settings-export-desc">{t("settings.exportDesc")}</p>
            <button
                type="button"
                className="btn-export"
                onClick={handleExport}
                disabled={exporting}
            >
              {exporting ? t("settings.exporting") : t("settings.export")}
            </button>
          </div>

          <div className="settings-footer">
            <button type="button" className="btn-logout" onClick={logout}>
              {t("settings.logout")}
            </button>
          </div>

        </div>
      </div>
  )
}