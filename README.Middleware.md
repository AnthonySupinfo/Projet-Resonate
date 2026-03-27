# Middleware JWT & Rôles - Resonate

Trois niveaux d'authentification via les dépendances FastAPI (`Depends`).

---

## Les 3 middlewares

| Middleware | Fichier | Comportement |
|---|---|---|
| `get_current_user` | `dependencies.py` | Token absent/invalide → `401` |
| `require_admin` | `dependencies.py` | Role !== admin → `403` |
| `get_optional_user` | `dependencies.py` | Pas de token → `None` (accès anonyme) |

### Analogie simple

- `get_current_user` - le videur : pas de badge JWT → tu ne rentres pas.
- `require_admin` - le responsable VIP : badge user → accès refusé.
- `get_optional_user` - la porte ouverte : connecté ou non, tu passes. Utile pour les fiches albums visibles sans compte.

---

## Utilisation dans une route

```python
from app.core.dependencies import get_current_user, require_admin, get_optional_user
from fastapi import Depends

# Route protégée — doit être connecté
@router.post("/reviews")
async def post_review(current_user=Depends(get_current_user)):
    return {"user_id": current_user["user_id"]}

# Route admin uniquement
@router.delete("/reviews/{id}")
async def delete_review(admin=Depends(require_admin)):
    return {"deleted": True}

# Route publique — connecté ou non
@router.get("/albums/{id}")
async def get_album(user=Depends(get_optional_user)):
    if user:
        return {"album": "...", "in_collection": True}
    return {"album": "..."}
```

> `get_current_user` et `get_optional_user` sont pour **Krishna** (albums) et **Mélissa** (reviews). Le middleware est prêt — ils n'ont qu'à importer et utiliser.

---

## Pourquoi une route `/token` ?

Le bouton "Authorize" de Swagger envoie les credentials en **form-data**.
Notre `/login` attend du **JSON** → incompatibilité → `422 Unprocessable Entity`.

La route `/token` (invisible dans Swagger via `include_in_schema=False`) accepte le form-data uniquement pour Swagger. En production elle peut être supprimée si Swagger est désactivé.

---

## Tests via Swagger

Ouvrir `http://localhost:8000/docs`.

### Se connecter via le bouton Authorize

1. Cliquer **"Authorize"** en haut à droite
2. `username` → `test@test.com` — `password` → `motdepasse1`
3. Laisser `client_id` et `client_secret` vides
4. Cliquer **"Authorize"** → **"Close"**

Toutes les routes utilisent maintenant le token automatiquement.

### Test 1 - Sans token → 401

Se déconnecter (Logout dans Authorize) puis :

`GET /api/v1/auth/me` → Try it out → Execute

```json
{"detail": "Token invalide ou expiré"}
```

### Test 2 - Avec token → 200

Être authentifié via Authorize puis :

`GET /api/v1/auth/me` → Try it out → Execute

```json
{"user_id": "uuid...", "role": "user"}
```

### Test 3 - User sur route admin → 403

`GET /api/v1/auth/admin-test` → Try it out → Execute

```json
{"detail": "Accès réservé aux administrateurs"}
```

---

## Tests via Git Bash

> Sur Windows Git Bash : commandes sur **une seule ligne**, jamais de `\`.

### Récupérer un token

```bash
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"motdepasse1\"}"
```

Copier `access_token` et remplacer `TON_TOKEN` dans les commandes suivantes.

### Test 1 - Sans token → 401

```bash
curl -X GET http://localhost:8000/api/v1/auth/me
```
Résultat attendu : `{"detail": "Token invalide ou expiré"}`

### Test 2 - Avec token → 200

```bash
curl -X GET http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer TON_TOKEN"
```
Résultat attendu : `{"user_id": "uuid...", "role": "user"}`

### Test 3 - User sur admin → 403

```bash
curl -X GET http://localhost:8000/api/v1/auth/admin-test -H "Authorization: Bearer TON_TOKEN"
```
Résultat attendu : `{"detail": "Accès réservé aux administrateurs"}`

### Test 4 - Token falsifié → 401

```bash
curl -X GET http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer tokeninvalide123"
```
Résultat attendu : `{"detail": "Token invalide ou expiré"}`

---

## Récapitulatif

| Test | Swagger | Bash | Code | Résultat |
|---|---|---|---|---|
| Sans token → `/me` | ✅ | ✅ | `401` | Token invalide ou expiré |
| Token valide → `/me` | ✅ | ✅ | `200` | user_id + role |
| User → `/admin-test` | ✅ | ✅ | `403` | Accès réservé aux administrateurs |
| Token falsifié → `/me` | ✅ | ✅ | `401` | Token invalide ou expiré |

---

## Sécurité

| Point | Statut |
|---|---|
| Token signé HS256 avec `JWT_SECRET_KEY` depuis `.env` | ✅ |
| Expiration 30 min - configurable | ✅ |
| Token falsifié détecté - `JWTError` → `401` | ✅ |
| Rôles `user` / `admin` vérifiés dans le payload | ✅ |
| Messages d'erreur génériques - pas d'info sur l'état du token | ✅ |
| Route `/token` cachée - `include_in_schema=False` | ✅ |
| Handler d'erreur global - pas de stack trace en production | ✅ |

### À faire avant la mise en production

- Supprimer la route `/admin-test` - dev uniquement
- HTTPS obligatoire - le token transite en clair sur HTTP
- Ajouter un refresh token - évite les déconnexions toutes les 30 min
