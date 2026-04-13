# Authentification & Profil Utilisateur

---

## Table `users` - Structure finale

Table complète :

```sql
┌─────────────────────┬──────────────┬───────────────────────────────────────────┐
│ Colonne             │ Type         │ Description                               │
├─────────────────────┼──────────────┼───────────────────────────────────────────┤
│ id                  │ VARCHAR PK   │ UUID généré automatiquement               │
│ email               │ VARCHAR      │ UNIQUE + INDEX — utilisé à la connexion   │
│ hashed_password     │ VARCHAR NULL │ Hash bcrypt — NULL pour comptes OAuth     │
│ username            │ VARCHAR      │ UNIQUE + INDEX — affiché sur le profil    │
│ role                │ VARCHAR      │ "user" ou "admin" — défaut "user"         │
│ is_active           │ BOOLEAN      │ TRUE par défaut — FALSE si banni          │
│ created_at          │ TIMESTAMP    │ Géré automatiquement par PostgreSQL       │
├─────────────────────┼──────────────┼───────────────────────────────────────────┤
│ avatar_url          │ VARCHAR NULL │ ← Ajouté Ticket 2 — URL photo de profil   │
│ bio                 │ TEXT NULL    │ ← Ajouté Ticket 2 — Biographie (300 chars)│
│ website             │ VARCHAR NULL │ ← Ajouté Ticket 2 — Lien site personnel   │
│ theme               │ VARCHAR      │ ← Ajouté Ticket 2 — "dark" ou "light"    │
└─────────────────────┴──────────────┴───────────────────────────────────────────┘
```

### Table `oauth_accounts`

```sql
┌─────────────────────┬──────────────┬───────────────────────────────────────────┐
│ Colonne             │ Type         │ Description                               │
├─────────────────────┼──────────────┼───────────────────────────────────────────┤
│ id                  │ VARCHAR PK   │ UUID unique                               │
│ user_id             │ FK → users   │ CASCADE DELETE — lien vers le user        │
│ provider            │ VARCHAR      │ "google" ou "github"                      │
│ provider_user_id    │ VARCHAR      │ ID unique chez Google/GitHub              │
│ provider_email      │ VARCHAR      │ Email récupéré depuis le provider         │
└─────────────────────┴──────────────┴───────────────────────────────────────────┘
```

> Un utilisateur peut avoir plusieurs lignes - un compte Google ET GitHub liés.

**Requête utile pour voir tous les utilisateurs :**
```sql
SELECT id, email, username, role, avatar_url, theme, is_active, created_at
FROM users
ORDER BY created_at DESC;
```

---

## Routes API - Vue complète

### Auth - `backend/app/api/v1/auth.py`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | Créer un compte |
| POST | `/api/v1/auth/login` | ❌ | Connexion → JWT |
| GET | `/api/v1/auth/me` | ✅ JWT | Infos utilisateur connecté |
| GET | `/api/v1/auth/admin-test` | ✅ Admin | Test accès admin |
| POST | `/api/v1/auth/forgot-password` | ❌ | Envoi email reset |
| POST | `/api/v1/auth/reset-password` | ❌ | Nouveau mot de passe |

### OAuth — `backend/app/api/v1/oauth.py`

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/v1/oauth/google/login` | Redirige vers Google |
| GET | `/api/v1/oauth/google/callback` | Retour Google → JWT |
| GET | `/api/v1/oauth/github/login` | Redirige vers GitHub |
| GET | `/api/v1/oauth/github/callback` | Retour GitHub → JWT |

### Users — `backend/app/api/v1/users.py` 

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✅ JWT | Profil complet avec avatar, bio, theme |
| PATCH | `/api/v1/users/me` | ✅ JWT | Modifier le profil (partiel) |
| GET | `/api/v1/users/me/export` | ✅ JWT | Export JSON RGPD |

[→ Clic ici pour voir le Guide et Test complet Swagger](./README.API.md)

---

## Authentification

### Inscription - POST `/api/v1/auth/register`

**Règles Pydantic :**
- email : format valide obligatoire
- username : 3–20 caractères, lettres/chiffres/underscores uniquement
- password : 6 caractères min + 2 chiffres min + 1 caractère spécial

**Flux :**
```
POST /register { email, username, password }
→ Validation Pydantic
→ Vérifie email unique (400 si pris)
→ Vérifie username unique (400 si pris)
→ Hash bcrypt du mot de passe
→ Création en BDD → 201
→ { id, email, username, role }
```

**Register.jsx - système 2 étapes :**
```
Étape 1 : username, email, mdp, confirmation + validation locale
Étape 2 : Nom, Prénom, Date de naissance, Avatar
→ register() + login() automatique → JWT → accueil
```

---

### Connexion - POST `/api/v1/auth/login`

**Flux :**
```
POST /login { email, password }
→ Cherche user par email
→ Vérifie bcrypt
→ Vérifie is_active
→ Génère JWT 30 min (HS256)
→ { access_token, token_type: "bearer" }
→ Frontend stocke dans localStorage
→ Redirige vers /
```

---

### OAuth2 - Google + GitHub

**Flux :**
```
Clic bouton Google/GitHub
→ GET /oauth/google/login → redirection Google
→ Utilisateur s'authentifie sur Google
→ Google → /oauth/google/callback?code=xxx
→ FastAPI échange le code → récupère email + ID
→ 3 cas : nouveau user / user OAuth existant / liaison compte email
→ Génère JWT Resonate
→ Redirige → localhost:5173/oauth/callback?token=JWT
→ OAuthCallback.jsx → handleLogin() → navigate("/")
```

**Configuration backend/.env :**
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

---

### Reset mot de passe

**Flux :**
```
POST /forgot-password { email }
→ Vérifie email en BDD
→ Génère JWT reset (1h, type="reset")
→ Envoie email via Gmail SMTP
→ Toujours 200 (ne confirme pas l'existence du compte)

POST /reset-password { token, new_password }
→ Décode JWT → vérifie type="reset"
→ Hash bcrypt nouveau mdp
→ Commit BDD
→ Redirige /login après 3s
```

---

### Middlewares - `core/dependencies.py`

| Middleware | Description |
|---|---|
| `get_current_user` | Vérifie JWT → 401 si invalide ou expiré |
| `require_admin` | Vérifie role == "admin" → 403 sinon |
| `get_optional_user` | Vérifie JWT sans bloquer si absent |

---

## Page Settings

**Backend :**
- 4 nouvelles colonnes dans `users` (avatar_url, bio, website, theme)
- 2 nouveaux schémas Pydantic (UserProfileResponse, UpdateProfileRequest)
- Nouveau fichier `api/v1/users.py` avec 3 routes

**Frontend :**
- Page `Settings.jsx` + `Settings.css`
- 3 nouvelles fonctions dans `api/auth.js`
- Traductions FR/EN ajoutées

---

### Profil - GET + PATCH `/api/v1/users/me`

**Chargement au démarrage (useEffect) :**
```
Montage Settings.jsx
→ GET /users/me → profil complet
→ Pré-remplit avatar, bio, website, theme
```

**Sauvegarde (PATCH partiel) :**
```json
{
  "avatar_url": "https://exemple.com/photo.jpg",
  "bio": "Passionné de jazz...",
  "website": "https://monsite.com",
  "theme": "light"
}
```
---

### Dark / Light Mode

```jsx
// React — classe CSS dynamique
<div className={`settings-wrapper ${theme}`}>

// CSS — couleurs selon la classe
.settings-wrapper        { background: #161515... }  /* dark défaut */
.settings-wrapper.light  { background: #f0f0f0... }  /* light */
```

---

### Export RGPD - GET `/api/v1/users/me/export`

```
Clique "Télécharger mes données"
→ GET /users/me/export → reçoit JSON
→ Crée Blob → URL temporaire
→ Téléchargement automatique → "resonate-mes-donnees.json"
→ Libère la mémoire
```

**Contenu du fichier exporté :**
```json
{
  "id": "uuid",
  "email": "anthony@gmail.com",
  "username": "anthony",
  "role": "user",
  "avatar_url": null,
  "bio": null,
  "website": null,
  "theme": "dark",
  "is_active": true,
  "created_at": "2026-04-04 09:00:00"
}
```

---

## Traduction FR/EN

**Fichiers concernés :**
```
src/context/LanguageContext.jsx  → état global lang: "fr" | "en"
src/translations/index.js        → tous les textes FR + EN
src/components/LanguageSwitch.jsx → bouton drapeau fixed top-right
```

**Pages traduites :** Login, Register, ForgotPassword, ResetPassword, Settings

**Utilisation :**
```jsx
const { t } = useLanguage()
<h1>{t("settings.title")}</h1>   // "Paramètres" ou "Settings"
```

---

## Sécurité globale

| Mesure | Description |
|---|---|
| bcrypt | Hash irréversible - résistant au brute-force |
| JWT HS256 | Signé avec JWT_SECRET_KEY depuis .env |
| Expiration 30 min | Token renouvelé à chaque connexion |
| hashed_password NULL | Comptes OAuth sans mot de passe vide en clair |
| 401 identique | Email inexistant = mauvais mdp → même message |
| ProtectedRoute | /settings inaccessible sans JWT valide |
| PATCH partiel | Seuls les champs envoyés sont modifiés |
| Validation thème | Seuls "dark" et "light" acceptés en BDD |
