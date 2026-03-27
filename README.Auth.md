# Authentification & OAuth2 - Resonate

Deux systèmes d'authentification complémentaires. Dans les deux cas le résultat est identique côté React : un token JWT stocké et envoyé dans chaque requête protégée.

---

## Base de données

### Table `users`

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique auto-généré |
| `email` | String | Unique — indexé |
| `username` | String | Unique — indexé |
| `hashed_password` | String (nullable) | Hash bcrypt — NULL pour les comptes OAuth |
| `role` | String | `"user"` ou `"admin"` — défaut `"user"` |
| `is_active` | Boolean | `true` par défaut — `false` si banni |
| `created_at` | DateTime | Géré par PostgreSQL |

### Table `oauth_accounts`

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `user_id` | FK → users.id | Lien vers l'utilisateur Resonate |
| `provider` | String | `"google"` ou `"github"` |
| `provider_user_id` | String | ID unique chez le provider |
| `provider_email` | String | Email récupéré depuis le provider |

> Un utilisateur peut avoir plusieurs entrées — un compte Google ET un compte GitHub liés.

---

## Authentification classique

### POST `/api/v1/auth/register`

**Règles de validation :**
- `email` : format valide
- `username` : 3 à 20 caractères, lettres/chiffres/underscores uniquement
- `password` : minimum 8 caractères + au moins 1 chiffre

**Ce qui se passe :**
1. Validation Pydantic → `422` si invalide
2. Email déjà utilisé → `400`
3. Username déjà utilisé → `400`
4. Hash bcrypt du mot de passe
5. Insertion en BDD → `201 Created`

**Test Swagger** — `POST /api/v1/auth/register` → Try it out :
```json
{
  "email": "test@test.com",
  "username": "testuser",
  "password": "motdepasse1"
}
```
Résultat attendu `201` :
```json
{
  "id": "uuid...",
  "email": "test@test.com",
  "username": "testuser",
  "role": "user"
}
```

**Test Bash :**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"username\":\"testuser\",\"password\":\"motdepasse1\"}"
```

---

### POST `/api/v1/auth/login`

**Ce qui se passe :**
1. Recherche par email
2. Vérification bcrypt du mot de passe
3. Vérification compte actif
4. Génération token JWT signé HS256
5. Retour `200 OK` avec le token

**Test Swagger** — `POST /api/v1/auth/login` → Try it out :
```json
{
  "email": "test@test.com",
  "password": "motdepasse1"
}
```
Résultat attendu `200` :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**Test Bash :**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"motdepasse1\"}"
```

**Codes d'erreur :**

| Code | Raison |
|---|---|
| `401` | Email ou mot de passe incorrect |
| `403` | Compte désactivé |
| `422` | Format invalide |

> Le `401` est identique que l'email soit inexistant ou le mot de passe incorrect — évite de confirmer l'existence d'un compte.

---

### Tests de validation

**Mot de passe trop court :**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"fail@test.com\",\"username\":\"failuser\",\"password\":\"abc\"}"
```
Résultat attendu `422` — "Le mot de passe doit faire au moins 8 caractères"

**Mot de passe sans chiffre :**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"fail@test.com\",\"username\":\"failuser\",\"password\":\"abcdefgh\"}"
```
Résultat attendu `422` — "Le mot de passe doit contenir au moins 1 chiffre"

---

## OAuth2 Google & GitHub

### Flux complet

```
1. React ouvre   → GET /api/v1/oauth/google/login
2. FastAPI       → Redirige vers accounts.google.com
3. Utilisateur   → Choisit son compte Google et accepte
4. Google        → Redirige vers /api/v1/oauth/google/callback?code=XXXX
5. FastAPI       → Échange le code contre un access_token Google
6. FastAPI       → Récupère le profil (id, email, nom)
7. FastAPI       → Gère l'utilisateur (3 cas ci-dessous)
8. FastAPI       → Génère un JWT Resonate
9. FastAPI       → Redirige vers localhost:5173/oauth/callback?token=<JWT>
10. React        → Récupère le token depuis l'URL et le stocke
```

### Les 3 cas gérés

**Cas 1 - Reconnexion** : compte OAuth déjà existant → JWT généré directement.

**Cas 2 - Liaison** : email déjà en BDD (compte classique) → entrée `oauth_accounts` créée, mot de passe intact.

**Cas 3 - Nouvel utilisateur** : aucun compte avec cet email → compte créé avec `hashed_password = NULL` + entrée `oauth_accounts`.

### Configurer les credentials

**Google :**
1. [console.cloud.google.com](https://console.cloud.google.com) → projet Resonate
2. APIs & Services → Credentials → Créer ID client OAuth → Application Web
3. URI de redirection : `http://localhost:8000/api/v1/oauth/google/callback`
4. Copier dans `backend/.env` : `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

**GitHub :**
1. [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
2. Authorization callback URL : `http://localhost:8000/api/v1/oauth/github/callback`
3. Copier dans `backend/.env` : `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`

### Test OAuth2

Ouvrir directement dans le navigateur :
```
http://localhost:8000/api/v1/oauth/google/login
http://localhost:8000/api/v1/oauth/github/login
```

Résultat attendu : redirection vers la page de connexion du provider, puis vers :
```
localhost:5173/oauth/callback?token=eyJhbGciOiJIUzI1NiJ9...
```

> L'erreur "impossible d'accéder à cette page" sur `localhost:5173` est normale — la page React `/oauth/callback` n'est pas encore codée. Le token dans l'URL confirme que le backend fonctionne.

---

## Sécurité

| Point | Implémentation |
|---|---|
| Mots de passe hashés | bcrypt — irréversible, résistant au brute-force |
| Token JWT signé | HS256 avec `JWT_SECRET_KEY` depuis `.env` |
| Expiration token | 30 min — configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` |
| `hashed_password = NULL` | Pour les comptes OAuth — jamais de mot de passe vide en clair |
| Messages d'erreur vagues | `401` identique si email inexistant ou mauvais mot de passe |
| Secret hors du code | `JWT_SECRET_KEY` uniquement dans `.env` — exclu de Git |

### Pourquoi bcrypt directement (sans passlib) ?

passlib 1.7.4 est incompatible avec bcrypt 5.x — bug interne lors du hash. On utilise bcrypt directement :

```python
# Hash
bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

# Vérification
bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
```