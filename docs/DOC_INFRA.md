# Documentation Infrastructure — Resonate

---

## 1. Vue d'ensemble

Resonate tourne entièrement en local via **Docker Compose**. Cinq services communiquent via des réseaux internes Docker, sans aucune dépendance cloud.

```
Internet
    │
    ▼
[nginx :443/:80]  ← HTTPS (mkcert)
    │
    ├──► [frontend :5173]  React + Vite
    │
    └──► [backend :8000]   FastAPI
              │
              └──► [db :5432]  PostgreSQL 16
                       ▲
              [pgadmin :5050]  Interface d'admin BDD
```

---

## 2. Docker Compose

### Services

| Service | Image | Rôle |
|---|---|---|
| `db` | postgres:16 | Base de données PostgreSQL |
| `backend` | build local | API FastAPI (Python) |
| `frontend` | build local | App React (Vite dev server) |
| `nginx` | nginx:alpine | Reverse proxy HTTPS |
| `pgadmin` | dpage/pgadmin4 | Interface d'administration BDD |

### Réseaux Docker

Trois réseaux isolent les services :

| Réseau | Services | Rôle |
|---|---|---|
| `frontend_backend` | nginx, frontend, backend, pgadmin | Trafic applicatif |
| `backend_db` | backend, db, pgadmin | **Réseau interne** — BDD non exposée |
| `backend_internet` | backend | Appels sortants (Last.fm, OAuth) |

Le réseau `backend_db` est déclaré `internal: true` : la base de données est **inaccessible depuis l'extérieur**, uniquement joignable par le backend et pgadmin.

### Healthcheck & Dépendances
Le backend et pgadmin démarrent uniquement quand PostgreSQL est prêt (`pg_isready`). Cela évite les erreurs de connexion au démarrage.

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U resonate_user -d resonate"]
  interval: 5s
  retries: 10
```

### Volumes persistants
- `postgres_data` : données PostgreSQL survivent aux `docker compose down`
- `pgadmin_data` : configuration pgAdmin
- `./frontend:/app` + `/app/node_modules` : permettent le hot-reload en développement sans écraser `node_modules`

---

## 3. nginx — Reverse Proxy HTTPS

### Rôle
nginx est le seul point d'entrée. Il reçoit tout le trafic sur le port 443 (HTTPS) et redirige :
- `/api/v1/` → backend FastAPI
- `/api/v1/ws` → WebSocket
- Tout le reste → frontend React

### Configuration notable

```nginx
# Blocage de la documentation API en production
location /docs { return 403; }
location /openapi.json { return 403; }

# Support WebSocket
location /api/v1/ws {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### Certificats HTTPS (mkcert)
Les certificats auto-signés sont générés par **mkcert** qui installe une autorité de certification locale dans le navigateur. Résultat : HTTPS valide en local, sans avertissement de sécurité.

Script automatisé `generate-certs.sh` :
```bash
mkcert -install              # Installe l'autorité locale
mkcert localhost 127.0.0.1   # Génère cert + clé dans nginx/certs/
```

---

## 4. Variables d'environnement

Trois fichiers `.env` séparés, jamais committés (`.gitignore`).

### `backend/.env`
```env
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET_KEY=...
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
LASTFM_API_KEY
MAIL_HOST / MAIL_PORT / MAIL_USERNAME / MAIL_PASSWORD
FRONTEND_URL=https://localhost
ENVIRONMENT=development
```

### `frontend/.env`
```env
VITE_API_BASE_URL=https://localhost
VITE_API_URL=https://localhost
```

### `/.env` (à la racine)
```env
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
PGADMIN_DEFAULT_EMAIL
PGADMIN_DEFAULT_PASSWORD
```



---

## 5. Schéma de base de données

### Migrations
Le projet utilise `Base.metadata.create_all` au démarrage (via le `lifespan` FastAPI). Toute modification de modèle nécessite un `docker compose down -v` pour recréer les tables.

### Tables principales (18 tables)

| Catégorie | Tables |
|---|---|
| Utilisateurs | `users`, `oauth_accounts`, `refresh_tokens` |
| Contenu musical | `albums`, `artists`, `tracks`, `album_search_cache` |
| Bibliothèque | `user_album_status`, `playlists`, `user_playlist_items`, `user_playlist_status` |
| Social | `follows`, `user_activity_feed`, `feed_comments`, `feed_likes` |
| Reviews | `reviews`, `review_likes`, `review_comments`, `reports` |
| Messagerie | `conversations`, `messages` |
| Notifications | `notifications` |

---

## 6. Git — Organisation des branches

```
main
├── feature/Anthony/...           # Sécurité, admin, RGPD, settings
├── feature/Elisa/...             # Social, feed, messagerie, profile, layout
├── feature/krishna/...           # API Last.fm, albums, recherche
└── feature/melissa/...           # Library, reviews, playlists
```

**Convention** : une branche par feature, rebase sur `main` avant merge et validation par l'équipe.

---

## 8. Tests

20 tests unitaires répartis en 4 fichiers (5 par développeur). Approche : tests purs Python sans imports de l'app pour éviter les problèmes de dépendances sur Windows (MINGW64). Couvrent : hashage, tokens, validation, pagination, tri, RGPD, notifications.

```bash
pytest tests/ -v   # 20/20 passed
```
