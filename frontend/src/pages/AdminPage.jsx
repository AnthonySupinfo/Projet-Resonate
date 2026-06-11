import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { authFetch } from "../api/auth"
import { useLanguage } from "../context/LanguageContext"
import iconSignal from '../../public/icons/signal.png';
import iconUser from '../../public/icons/user.png';
import iconLike from '../../public/icons/likeLiked.png';
import "./AdminPage.css"

const API_URL = import.meta.env.VITE_API_URL || ""

export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [reports, setReports]       = useState([])
  const [filter, setFilter]         = useState("PENDING")
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError]           = useState("")
  const [success, setSuccess]       = useState("")

  // Onglet actif : signalements, coups de cœur ou utilisateurs
  const [tab, setTab] = useState("reports")

  // Coups de cœur — liste des critiques mises en avant
  const [featuredReviews, setFeaturedReviews] = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(false)
  const [unfeatureLoading, setUnfeatureLoading] = useState(null)

  // Gestion des utilisateurs
  const [userSearch, setUserSearch]     = useState("")
  const [userResults, setUserResults]   = useState([])
  const [userLoading, setUserLoading]   = useState(false)
  const [userActionLoading, setUserActionLoading] = useState(null)

  // Redirige si pas admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/")
    }
  }, [user])

  // Charge les signalements
  useEffect(() => {
    if (tab === "reports") loadReports()
    if (tab === "featured") loadFeatured()
  }, [filter, tab])

  async function loadFeatured() {
    setFeaturedLoading(true)
    try {
      const res = await authFetch(`${API_URL}/api/v1/admin/featured`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFeaturedReviews(data)
    } catch {
      setError(t('admin.errorLoadFeatured'))
    } finally {
      setFeaturedLoading(false)
    }
  }

  async function handleUnfeature(reviewId) {
    setUnfeatureLoading(reviewId)
    try {
      const res = await authFetch(`${API_URL}/api/v1/admin/reviews/${reviewId}/unfeature`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      setFeaturedReviews(prev => prev.filter(r => r.id !== reviewId))
      setSuccess(t('admin.featuredRemoved'))
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      setError(t('admin.errorRemoveFeatured'))
    } finally {
      setUnfeatureLoading(null)
    }
  }

  async function loadReports() {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch(`${API_URL}/api/v1/admin/reports?status_filter=${filter}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data)
    } catch {
      setError(t('admin.errorLoadReports'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(reportId, action) {
    setActionLoading(reportId)
    setError("")
    try {
      const res = await authFetch(`${API_URL}/api/v1/admin/reports/${reportId}/${action}`, {
        method: "PATCH"
      })
      if (!res.ok) throw new Error()
      setSuccess(action === "resolve" ? t('admin.reportResolved') : t('admin.reportDismissed'))
      setTimeout(() => setSuccess(""), 3000)
      // Retire le signalement traité de la liste
      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch {
      setError(t('admin.errorGeneric'))
    } finally {
      setActionLoading(null)
    }
  }

  // Recherche d'utilisateurs par username
  async function handleUserSearch(e) {
    e.preventDefault()
    if (!userSearch.trim()) return
    setUserLoading(true)
    setError("")
    try {
      const res = await authFetch(`${API_URL}/api/v1/search/users?q=${encodeURIComponent(userSearch)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUserResults(data.results || [])
      if ((data.results || []).length === 0) setError(t('admin.noUserFound'))
    } catch {
      setError(t('admin.errorSearch'))
    } finally {
      setUserLoading(false)
    }
  }

  // Bannir ou réactiver un utilisateur
  async function handleUserAction(userId, action) {
    setUserActionLoading(userId)
    setError("")
    try {
      const res = await authFetch(`${API_URL}/api/v1/users/${userId}/${action}`, {
        method: "PATCH"
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || t('admin.errorGeneric'))
      }
      setSuccess(action === "ban" ? t('admin.userBanned') : t('admin.userUnbanned'))
      setTimeout(() => setSuccess(""), 3000)
      // Met à jour le statut dans la liste locale
      setUserResults(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: action === "unban" } : u
      ))
    } catch (err) {
      setError(err.message || t('admin.errorGeneric'))
    } finally {
      setUserActionLoading(null)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  function statusBadge(status) {
    const map = {
      PENDING:   { label: t('admin.pending'),   cls: "badge--pending"  },
      RESOLVED:  { label: t('admin.resolved'),  cls: "badge--resolved" },
      DISMISSED: { label: t('admin.dismissed'), cls: "badge--dismissed"},
    }
    const s = map[status] || { label: status, cls: "" }
    return <span className={`badge ${s.cls}`}>{s.label}</span>
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">{t('admin.title')}</h1>
        <p className="admin-subtitle">{t('admin.subtitle')}</p>
      </div>

      {/* Onglets */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "reports" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("reports")}
        >
          <img src={iconSignal} alt={t('admin.tabReports')} />
          {t('admin.tabReports')}
        </button>
        <button
          className={`admin-tab ${tab === "featured" ? "admin-tab--active" : ""}`}
          onClick={() => setTab("featured")}
        >
          <img src={iconLike} alt={t('admin.tabFeatured')} />
          {t('admin.tabFeatured')}
        </button>
        <button
          className={`admin-tab ${tab === "users" ? "admin-tab--active" : ""}`}
          onClick={() => { setTab("users"); setUserResults([]); setError("") }}
        >
          <img src={iconUser} alt={t('admin.tabUsers')} />
          {t('admin.tabUsers')}
        </button>
      </div>

      {/* Messages */}
      {success && <p className="admin-success">{success}</p>}
      {error   && <p className="admin-error">{error}</p>}

      {/* ═══ ONGLET SIGNALEMENTS ═══ */}
      {tab === "reports" && (
        <>
          {/* Filtres */}
          <div className="admin-filters">
            {["PENDING", "RESOLVED", "DISMISSED", "ALL"].map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${filter === f ? "admin-filter-btn--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "PENDING" ? t('admin.pending') : f === "RESOLVED" ? t('admin.resolved') : f === "DISMISSED" ? t('admin.dismissed') : t('admin.all')}
              </button>
            ))}
          </div>

          {/* Tableau des signalements */}
          {loading ? (
            <p className="admin-loading">{t('admin.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="admin-empty">{t('admin.noReports')} {filter !== "ALL" ? t('admin.inCategory') : ""}.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('admin.target')}</th>
                    <th>{t('admin.reportedBy')}</th>
                    <th>{t('admin.reason')}</th>
                    <th>{t('admin.date')}</th>
                    <th>{t('admin.status')}</th>
                    {filter === "PENDING" && <th>{t('admin.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id} className="admin-row--clickable" onClick={() => {
                      if (report.reported_user_id) {
                        navigate(`/user/${report.reported_user_id}`)
                      } else if (report.album_artist && report.album_name) {
                        navigate(`/albums/${encodeURIComponent(report.album_artist)}/${encodeURIComponent(report.album_name)}`)
                      }
                    }} title={report.reported_user_id ? `@${report.reported_username}` : report.album_name || ""}>
                      <td>{report.id}</td>
                      <td>{report.reported_user_id ? `👤 @${report.reported_username || "user"}` : `📝 #${report.review_id}`}</td>
                      <td className="admin-cell--id">@{report.reporter_username || report.reporter_id?.slice(0, 8) + "…"}</td>
                      <td className="admin-cell--reason">{report.reason}</td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>{statusBadge(report.status)}</td>
                      {filter === "PENDING" && (
                        <td className="admin-cell--actions">
                          <button
                            className="admin-btn admin-btn--resolve"
                            disabled={actionLoading === report.id}
                            onClick={(e) => { e.stopPropagation(); handleAction(report.id, "resolve") }}
                          >
                            {actionLoading === report.id ? "..." : `✓ ${t('admin.resolve')}`}
                          </button>
                          <button
                            className="admin-btn admin-btn--dismiss"
                            disabled={actionLoading === report.id}
                            onClick={(e) => { e.stopPropagation(); handleAction(report.id, "dismiss") }}
                          >
                            {actionLoading === report.id ? "..." : `✕ ${t('admin.dismiss')}`}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ═══ ONGLET COUPS DE CŒUR ═══ */}
      {tab === "featured" && (
        <div className="admin-feature-section">
          <p className="admin-feature-desc">{t('admin.featuredDesc')}</p>
          {featuredLoading ? (
            <p className="admin-loading">{t('admin.loading')}</p>
          ) : featuredReviews.length === 0 ? (
            <p className="admin-empty">{t('admin.noFeatured')}</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('admin.author')}</th>
                    <th>{t('admin.album')}</th>
                    <th>{t('admin.artist')}</th>
                    <th>{t('admin.excerpt')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {featuredReviews.map(r => (
                    <tr key={r.id} className="admin-row--clickable" onClick={() => r.album_artist && r.album_name && navigate(`/albums/${encodeURIComponent(r.album_artist)}/${encodeURIComponent(r.album_name)}`)} title={r.album_name || ""}>
                      <td>{r.id}</td>
                      <td>@{r.author_username}</td>
                      <td>{r.album_name}</td>
                      <td className="admin-cell--id">{r.album_artist}</td>
                      <td className="admin-cell--reason">{r.content?.slice(0, 60)}{r.content?.length > 60 ? "…" : ""}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn--unfeature"
                          disabled={unfeatureLoading === r.id}
                          onClick={(e) => { e.stopPropagation(); handleUnfeature(r.id) }}
                        >
                          {unfeatureLoading === r.id ? "..." : `💔 ${t('admin.remove')}`}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ ONGLET UTILISATEURS ═══ */}
      {tab === "users" && (
        <div className="admin-users-section">
          <p className="admin-feature-desc">{t('admin.usersDesc')}</p>
          <form className="admin-feature-form" onSubmit={handleUserSearch}>
            <input
              type="text"
              className="admin-feature-input admin-feature-input--wide"
              placeholder="@username"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <button
              type="submit"
              className="admin-btn admin-btn--search"
              disabled={userLoading || !userSearch.trim()}
            >
              {userLoading ? "..." : `🔍 ${t('admin.search')}`}
            </button>
          </form>

          {/* Résultats */}
          {userResults.length > 0 && (
            <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.avatar')}</th>
                    <th>{t('admin.username')}</th>
                    <th>{t('admin.email')}</th>
                    <th>{t('admin.fullName')}</th>
                    <th>{t('admin.status')}</th>
                    <th>{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userResults.map(u => (
                    <tr key={u.id}>
                      <td>
                        <span style={{ fontSize: "22px" }}>{u.avatar_url || "👤"}</span>
                      </td>
                      <td>@{u.username}</td>
                      <td className="admin-cell--id">{u.email}</td>
                      <td>{u.first_name || ""} {u.last_name || ""}</td>
                      <td>
                        {u.is_active !== false
                          ? <span className="badge badge--resolved">{t('admin.active')}</span>
                          : <span className="badge badge--dismissed">{t('admin.banned')}</span>
                        }
                      </td>
                      <td className="admin-cell--actions">
                        {u.is_active !== false ? (
                          <button
                            className="admin-btn admin-btn--ban"
                            disabled={userActionLoading === u.id || u.id === user.id}
                            onClick={() => handleUserAction(u.id, "ban")}
                            title={u.id === user.id ? t('admin.cannotBanSelf') : ""}
                          >
                            {userActionLoading === u.id ? "..." : `🚫 ${t('admin.ban')}`}
                          </button>
                        ) : (
                          <button
                            className="admin-btn admin-btn--unban"
                            disabled={userActionLoading === u.id}
                            onClick={() => handleUserAction(u.id, "unban")}
                          >
                            {userActionLoading === u.id ? "..." : `✓ ${t('admin.unban')}`}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}