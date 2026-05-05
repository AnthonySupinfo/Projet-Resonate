const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

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

// Profil connecté
export async function getMe(token) {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
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

// Profil complet (Settings)
export async function getProfile(token) {
  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  if (!response.ok) return null
  return await response.json()
}

// Modifier le profil (avatar, bio, website, theme)
export async function updateProfile(token, data) {
  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || "Erreur lors de la mise à jour")
  return result
}

// Télécharger ses données (RGPD)
export async function exportData(token) {
  const response = await fetch(`${API_URL}/api/v1/users/me/export`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Erreur lors de l'export")
  return await response.json()
}