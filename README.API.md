# API Resonate - Swagger

> **Swagger UI :** http://localhost:8000/docs
> **Base URL :** http://localhost:8000/api/v1
> **Fichiers backend :** `backend/app/api/v1/`

---

## Comment utiliser Swagger

1. Lancez Docker : `docker compose up`
2. Ouvrez `http://localhost:8000/docs`
3. Pour les routes protégées :
   - Cliquez sur **"Authorize"** en haut à droite
   - Entrez votre token JWT obtenu via `/auth/login`
   - Cliquez **"Authorize"** puis **"Close"**
4. Cliquez sur une route -> **"Try it out"** -> **"Execute"**

---

## Auth - `backend/app/api/v1/auth.py`

---

### POST `/api/v1/auth/register`
> Route publique - pas de token requis

**Description :** Crée un nouveau compte utilisateur dans la BDD.

**Corps de la requête :**
```json
{
  "email": "luffy@gmail.com",
  "username": "luffy",
  "password": "azerty12!"
}
```

**Réponse attendue (201) :**
```json
{
  "id": "uuid-généré-automatiquement",
  "email": "luffy@gmail.com",
  "username": "luffy",
  "role": "user"
}
```

**Erreurs possibles :**
- `400` - Email ou username déjà utilisé
- `422` - Format email invalide / mdp trop court / username invalide

---

### POST `/api/v1/auth/login`
> Route publique - pas de token requis

**Description :** Connecte un utilisateur et renvoie un token JWT valable 30 minutes.

**Corps de la requête :**
```json
{
  "email": "luffy@gmail.com",
  "password": "azerty12!"
}
```

**Réponse attendue (200) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Erreurs possibles :**
- `401` - Email ou mot de passe incorrect

> Copiez le `access_token` et collez-le dans **"Authorize"** pour tester les routes protégées.

---

### GET `/api/v1/auth/me`
> Route protégée - JWT requis dans Authorization header

**Description :** Renvoie les informations de l'utilisateur actuellement connecté (vérifie que le JWT est valide).

**Header requis :** `Authorization: Bearer <token>`

**Réponse attendue (200) :**
```json
{
  "user_id": "uuid-de-l-utilisateur",
  "role": "user"
}
```

**Erreurs possibles :**
- `401` - Token manquant, invalide ou expiré

> Utile pour tester que le JWT fonctionne correctement.

---

### GET `/api/v1/auth/admin-test` 
> Route protégée - JWT requis dans Authorization header 
> Route admin uniquement - role "admin" requis

**Description :** Route de test accessible uniquement aux administrateurs. Vérifie que le système de rôles fonctionne.

**Header requis :** `Authorization: Bearer <token_admin>`

**Réponse attendue (200) :**
```json
{
  "message": "Accès admin confirmé",
  "user_id": "uuid-admin"
}
```

**Erreurs possibles :**
- `401` - Non connecté
- `403` - Connecté mais pas admin (role = "user")

> Pour tester : créer un user, modifier son role en "admin" via pgAdmin, puis retester.

---

### POST `/api/v1/auth/forgot-password`
> Route publique - pas de token requis

**Description :** Envoie un email de réinitialisation de mot de passe si l'adresse existe en BDD. Renvoie toujours 200 pour ne pas révéler si l'email existe ou non (sécurité).

**Corps de la requête :**
```json
{
  "email": "luffy@gmail.com"
}
```

**Réponse attendue (200) :**
```json
{
  "message": "Si cet email existe, un lien de réinitialisation a été envoyé."
}
```

> L'email doit correspondre à un vrai compte avec une vraie adresse mail. Le lien dans l'email expire après **1 heure**.

---

### POST `/api/v1/auth/reset-password`
> Route publique - pas de token requis

**Description :** Réinitialise le mot de passe d'un utilisateur grâce au token reçu par email.

**Corps de la requête :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "nouveaumdp12"
}
```

**Réponse attendue (200) :**
```json
{
  "message": "Mot de passe modifié avec succès"
}
```

**Erreurs possibles :**
- `400` - Token invalide ou expiré
- `422` - Mot de passe trop court / pas assez de chiffres

> Le token se récupère dans le lien de l'email reçu après / forgot-password.

---

## OAuth - `backend/app/api/v1/oauth.py`

---

### GET `/api/v1/oauth/google/login`
> Route publique - pas de token requis

**Description :** Redirige l'utilisateur vers la page de connexion Google. Ne pas tester via Swagger - ouvrir directement dans le navigateur.

**Test :** Ouvrir dans le navigateur :
```
http://localhost:8000/api/v1/oauth/google/login
```

**Résultat attendu :** Redirection vers la page de connexion Google.

---

### GET `/api/v1/oauth/google/callback`
> Route publique - pas de token requis

**Description :** Route de retour appelée automatiquement par Google après authentification. Ne jamais appeler manuellement.

**Appelée automatiquement par Google avec :**
```
?code=xxx&state=xxx
```

**Résultat :** Redirige vers `localhost:5173/oauth/callback?token=JWT`

> Cette route ne s'utilise pas directement, c'est Google qui l'appelle.

---

### GET `/api/v1/oauth/github/login`
> Route publique - pas de token requis

**Description :** Redirige l'utilisateur vers la page de connexion GitHub. Ne pas tester via Swagger, ouvrir directement dans le navigateur.

**Test :** Ouvrir dans le navigateur :
```
http://localhost:8000/api/v1/oauth/github/login
```

**Résultat attendu :** Redirection vers la page de connexion GitHub.

---

### GET `/api/v1/oauth/github/callback`
> Route publique - pas de token requis

**Description :** Route de retour appelée automatiquement par GitHub après authentification. Ne jamais appeler manuellement.

**Résultat :** Redirige vers `localhost:5173/oauth/callback?token=JWT`

> Cette route ne s'utilise pas directement, c'est GitHub qui l'appelle.

---

## Users - `backend/app/api/v1/users.py`

---

### GET `/api/v1/users/me` 
> Route protégée - JWT requis dans Authorization header

**Description :** Récupère le profil complet de l'utilisateur connecté, incluant avatar, bio, site web et thème.

**Header requis :** `Authorization: Bearer <token>`

**Réponse attendue (200) :**
```json
{
  "id": "uuid",
  "email": "luffy@gmail.com",
  "username": "luffy",
  "role": "user",
  "avatar_url": "https://exemple.com/photo.jpg",
  "bio": "Passionné de jazz et de rock progressif",
  "website": "https://monsite.com",
  "theme": "dark"
}
```

**Erreurs possibles :**
- `401` - Token manquant ou invalide

---

### PATCH `/api/v1/users/me` 
> Route protégée - JWT requis dans Authorization header

**Description :** Modifie le profil de l'utilisateur connecté. Tous les champs sont optionnels, seuls les champs envoyés sont mis à jour.

**Header requis :** `Authorization: Bearer <token>`

**Corps de la requête (tous optionnels) :**
```json
{
  "avatar_url": "https://exemple.com/nouvelle-photo.jpg",
  "bio": "Ma nouvelle bio",
  "website": "https://nouveau-site.com",
  "theme": "light"
}
```

**Réponse attendue (200) :** Profil complet mis à jour (même format que GET /users/me)

**Erreurs possibles :**
- `401` - Token invalide
- `422` - theme invalide (doit être "dark" ou "light") / website sans http://

> On peut envoyer un seul champ à la fois. Exemple : juste `{ "theme": "light" }` pour changer uniquement le thème.

---

### GET `/api/v1/users/me/export` 
> Route protégée - JWT requis dans Authorization header

**Description :** Exporte toutes les données personnelles de l'utilisateur au format JSON (obligation légale RGPD en Europe).

**Header requis :** `Authorization: Bearer <token>`

**Réponse attendue (200) :**
```json
{
  "id": "uuid",
  "email": "luffy@gmail.com",
  "username": "luffy",
  "role": "user",
  "avatar_url": null,
  "bio": null,
  "website": null,
  "theme": "dark",
  "is_active": true,
  "created_at": "2026-04-04 09:00:00"
}
```

> Sur le frontend, ce JSON est automatiquement téléchargé sous le nom : resonate-mes-donnees.json.

---

## Default - `backend/app/main.py`

---

### GET `/health`
> Route publique - pas de token requis

**Description :** Vérifie que le serveur backend est bien démarré et répond. Utilisé par Docker pour le healthcheck.

**Réponse attendue (200) :**
```json
{
  "status": "ok",
  "service": "resonate-backend"
}
```

> Si cette route ne répond pas, Docker considère le backend comme "unhealthy" et le redémarre.

---

## Schémas - `backend/app/schemas/auth.py`

Les schémas sont les structures de données que l'API accepte en entrée et renvoie en sortie. Pydantic les utilise pour valider automatiquement les données.

---

### `RegisterRequest`
**Utilisé par :** POST `/auth/register`
**Direction :** Entrée (ce que le frontend envoie)
```json
{
  "email": "string (format email valide)",
  "username": "string (3-20 chars, lettres/chiffres/_)",
  "password": "string (6 caractères min, 2 chiffres min, 1 caractère spécial !@#...)"
}
```

---

### `LoginRequest`
**Utilisé par :** POST `/auth/login`
**Direction :** Entrée
```json
{
  "email": "string",
  "password": "string"
}
```

---

### `TokenResponse`
**Utilisé par :** POST `/auth/login`, POST `/auth/token`
**Direction :** Sortie (ce que l'API renvoie)
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

### `UserResponse`
**Utilisé par :** POST `/auth/register`
**Direction :** Sortie
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "role": "string"
}
```

> Renvoie les infos de base sans le mot de passe ni les champs de profil.

---

### `UserProfileResponse`
**Utilisé par :** GET `/users/me`, PATCH `/users/me`
**Direction :** Sortie
```json
{
  "id": "uuid",
  "email": "string",
  "username": "string",
  "role": "string",
  "avatar_url": "string | null",
  "bio": "string | null",
  "website": "string | null",
  "theme": "dark | light"
}
```

> Version complète de UserResponse avec les champs de profil Settings.

---

### `UpdateProfileRequest`
**Utilisé par :** PATCH `/users/me`
**Direction :** Entrée
```json
{
  "avatar_url": "string | null (optionnel)",
  "bio": "string | null (optionnel)",
  "website": "string | null (doit commencer par http://)",
  "theme": "dark | light (optionnel)"
}
```

> Tous les champs sont optionnels - envoyer uniquement ce qu'on veut modifier.

---

### `ForgotPasswordRequest`
**Utilisé par :** POST `/auth/forgot-password`
**Direction :** Entrée
```json
{
  "email": "string (format email valide)"
}
```

---

### `ResetPasswordRequest`
**Utilisé par :** POST `/auth/reset-password`
**Direction :** Entrée
```json
{
  "token": "string (JWT reçu par email)",
  "new_password": "string (6 caractères min, 2 chiffres min, 1 caractère spécial !@#...)"
}
```

---

### `HTTPValidationError` et `ValidationError`
Générés automatiquement par Pydantic quand les données envoyées ne respectent pas le schéma attendu.

**Exemple - email invalide :**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

> Ces erreurs correspondent au code HTTP : 422 Unprocessable Entity.

---

## Ordre de test recommandé sur Swagger

```
1. POST /auth/register          → créer un compte
2. POST /auth/login             → obtenir le JWT
3. Clic "Authorize"             → coller le JWT
4. GET  /auth/me                → vérifier le JWT
5. GET  /users/me               → voir le profil complet
6. PATCH /users/me              → modifier le profil
7. GET  /users/me/export        → télécharger les données
8. POST /auth/forgot-password   → tester l'envoi email
9. GET  /health                 → vérifier que le serveur tourne
```
