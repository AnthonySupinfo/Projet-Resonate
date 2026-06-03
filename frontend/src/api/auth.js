const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// Flag pour éviter les appels refresh en parallèle
let isRefreshing = false
let refreshPromise = null

// Renouvelle les tokens via le refresh token
export async function refreshTokens(refreshToken) {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!response.ok) return null
  return await response.json()
}

// Fetch authentifié avec retry automatique sur 401
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token")
  const config = {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    }
  }

  let response = await fetch(url, config)

  // Si 401 (tente un refresh transparent)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) return response

    // Un seul refresh à la fois
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshTokens(refreshToken)
    }

    const tokens = await refreshPromise
    isRefreshing = false
    refreshPromise = null

    if (!tokens) {
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      return response
    }

    // Stocke les nouveaux tokens
    localStorage.setItem("token", tokens.access_token)
    localStorage.setItem("refresh_token", tokens.refresh_token)

    // Rejoue la requête originale avec le nouveau token
    config.headers["Authorization"] = `Bearer ${tokens.access_token}`
    response = await fetch(url, config)
  }

  return response
}

// Inscription
export async function register(email, username, password, firstName, lastName, birthDate, avatarUrl) {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      username,
      password,
      first_name: firstName || null,
      last_name: lastName || null,
      birth_date: birthDate || null,
      avatar_url: avatarUrl || null,
    })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || "Erreur lors de l'inscription")
  return data
}

// Connexion
export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || "Email ou mot de passe incorrect")
  return data
}

// Profil connecté utilise authFetch pour le refresh automatique
export async function getMe() {
  const response = await authFetch(`${API_URL}/api/v1/auth/me`)
  if (!response.ok) return null
  return await response.json()
}

// Vérification disponibilité email/identifiant
export async function checkAvailability(email, username) {
  const response = await fetch(`${API_URL}/api/v1/auth/check-availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || "Erreur de vérification")
  return data
}

// OAuth2
export function loginWithGoogle() {
  window.location.href = `${API_URL}/api/v1/oauth/google/login`
}

export function loginWithGithub() {
  window.location.href = `${API_URL}/api/v1/oauth/github/login`
}

// Déconnexion côté serveur (révoque les refresh tokens)
export async function logoutServer() {
  try {
    await authFetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST"
    })
  } catch {
    // Ignore on déconnecte côté client dans tous les cas
  }
}

// Profil complet (Settings) utilise authFetch pour le refresh automatique
export async function getProfile() {
  const response = await authFetch(`${API_URL}/api/v1/users/me`)
  if (!response.ok) return null
  return await response.json()
}

// Modifier le profil (avatar, bio, website, theme) utilise authFetch pour le refresh automatique
export async function updateProfile(data) {
  const response = await authFetch(`${API_URL}/api/v1/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || "Erreur lors de la mise à jour")
  return result
}

// Télécharger ses données (RGPD) utilise authFetch pour le refresh automatique
export async function exportData() {
  const response = await authFetch(`${API_URL}/api/v1/users/me/export`)
  if (!response.ok) throw new Error("Erreur lors de l'export")
  return await response.json()
}

export async function getUserProfile(userId) {
  const response = await authFetch(`${API_URL}/api/v1/users/${userId}`)
  if (!response.ok) return null
  return await response.json()
}

export async function getUserStats(userId) {
  const response = await authFetch(`${API_URL}/api/v1/users/${userId}/stats`)
  if (!response.ok) return null
  return await response.json()
}

// Changer son mot de passe (nécessite le mot de passe actuel)
export async function changePassword(currentPassword, newPassword) {
  const response = await authFetch(`${API_URL}/api/v1/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword
    })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || "Erreur lors du changement de mot de passe")
  return result
}

// Changer son email (nécessite le mot de passe actuel)
export async function changeEmail(currentPassword, newEmail) {
  const response = await authFetch(`${API_URL}/api/v1/auth/change-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      new_email: newEmail
    })
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || "Erreur lors du changement d'email")
  return result
}

// Supprimer son compte (nécessite le mot de passe)
export async function deleteAccount(password) {
  const response = await authFetch(`${API_URL}/api/v1/users/me`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  })
  if (response.status === 204) return true
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || "Erreur lors de la suppression du compte")
  return true
}