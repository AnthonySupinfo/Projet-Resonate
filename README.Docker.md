# Docker - Resonate

Stack : **React + Vite** (frontend) · **FastAPI + Python** (backend) · **PostgreSQL** (base de données)

---

## Structure du projet

```
projet_resonate/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # Routes REST
│   │   ├── core/          # Config, sécurité, JWT
│   │   ├── db/            # Connexion base de données
│   │   ├── models/        # Tables SQLAlchemy
│   │   ├── schemas/       # Validation Pydantic
│   │   ├── services/      # Logique métier
│   │   └── main.py        # Point d'entrée FastAPI
│   ├── .env               # Secrets — jamais sur Git
│   ├── .env.example       # Template — sur Git
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # Appels HTTP vers le backend uniquement
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/       # Auth, Thème
│   │   └── hooks/
│   ├── .env               # Secrets — jamais sur Git
│   ├── .env.example       # Template — sur Git
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Prérequis

| Outil | Pourquoi | Lien |
|---|---|---|
| Docker Desktop | Fait tourner les 3 services | https://www.docker.com/products/docker-desktop |
| Git + Git Bash | Cloner le repo + terminal | https://git-scm.com/downloads |

> Sur Windows : toujours utiliser **Git Bash**, jamais PowerShell. PowerShell crée des fichiers en UTF-16 incompatibles avec Python.

---

## Installation

### 1 - Cloner le repo

```bash
git clone <url-du-repo>
cd projet_resonate
```

### 2 - Créer les fichiers .env

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3 - Générer la clé JWT

```bash
openssl rand -hex 32
```

Copier le résultat dans `backend/.env` :
```env
JWT_SECRET_KEY=<colle_ta_clé_ici>
```

> Cette commande ne nécessite pas Docker — `openssl` est inclus avec Git Bash.

### 4 - Lancer le projet

```bash
docker compose up --build
```

Attendre ces 3 lignes dans les logs :
```
db-1       | database system is ready to accept connections
backend-1  | INFO: Application startup complete.
frontend-1 | VITE v8.x  ready in Xms
```

### 5 - Vérifier

| URL | Résultat attendu |
|---|---|
| `http://localhost:5173` | Page React |
| `http://localhost:8000/health` | `{"status":"ok","service":"resonate-backend"}` |
| `http://localhost:8000/docs` | Interface Swagger |

---

## Variables d'environnement

### `backend/.env`

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql+asyncpg://resonate_user:resonate_pass@db:5432/resonate` |
| `JWT_SECRET_KEY` | Clé de signature JWT | `openssl rand -hex 32` |
| `JWT_ALGORITHM` | Algorithme JWT | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Durée du token | `30` |
| `FRONTEND_URL` | URL React (CORS) | `http://localhost:5173` |
| `ENVIRONMENT` | Environnement | `development` |
| `GOOGLE_CLIENT_ID` | OAuth2 Google | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Google | Google Cloud Console |
| `GITHUB_CLIENT_ID` | OAuth2 GitHub | GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | OAuth2 GitHub | GitHub Developer Settings |
| `LASTFM_API_KEY` | API Last.fm | https://www.last.fm/api |
| `LASTFM_API_SECRET` | API Last.fm | https://www.last.fm/api |

### `frontend/.env`

| Variable | Description | Valeur |
|---|---|---|
| `VITE_API_BASE_URL` | URL du backend | `http://localhost:8000` |

---

## Commandes quotidiennes

```bash
docker compose up              # Démarrer
docker compose up --build      # Démarrer + reconstruire
docker compose down            # Arrêter
docker compose down -v         # Arrêter + supprimer les données BDD
docker compose logs -f         # Logs en temps réel
docker compose logs -f backend # Logs d'un service
docker compose ps              # État des conteneurs
```

---

## Ports

| Service | URL | Accessible depuis |
|---|---|---|
| Frontend | `http://localhost:5173` | Navigateur |
| Backend | `http://localhost:8000` | Navigateur + frontend |
| PostgreSQL | `localhost:5432` | Backend uniquement |

---

## Isolation réseau

Trois réseaux Docker séparés pour bloquer le frontend depuis Last.fm :

| Réseau | Type | Relie |
|---|---|---|
| `frontend_backend` | `internal: true` | Frontend ↔ Backend — sans internet |
| `backend_internet` | bridge normal | Backend → internet (Last.fm) |
| `backend_db` | `internal: true` | Backend ↔ PostgreSQL — sans internet |

Le frontend est uniquement sur `frontend_backend` — il est **structurellement incapable** de joindre Last.fm, même si quelqu'un écrivait du code React pour le faire.

### Test de l'isolation

```bash
# Créer les scripts de test
cat > /tmp/test_network.js << 'EOF'
fetch('https://ws.audioscrobbler.com/2.0/')
  .then(r => console.log('CONNECTE - PROBLEME'))
  .catch(e => console.log('BLOQUE - OK'))
EOF

cat > /tmp/test_network.py << 'EOF'
import urllib.request
try:
    urllib.request.urlopen('https://ws.audioscrobbler.com/2.0/')
    print('CONNECTE - OK')
except Exception as e:
    print('BLOQUE - PROBLEME:', e)
EOF

# Copier dans les conteneurs
docker cp /tmp/test_network.js projet_resonate-frontend-1:/app/test_network.js
docker cp /tmp/test_network.py projet_resonate-backend-1:/app/test_network.py

# Exécuter
docker exec projet_resonate-frontend-1 node //app/test_network.js
docker exec projet_resonate-backend-1 python //app/test_network.py
```

**Résultats attendus :**
```
BLOQUE - OK                        ← frontend bloqué
BLOQUE - PROBLEME: HTTP Error 400  ← backend connecté (400 = Last.fm répond)
```

---

## Problèmes fréquents

**"Could not import module app.main"** — `__init__.py` manquants :
```bash
touch backend/app/__init__.py backend/app/api/__init__.py backend/app/api/v1/__init__.py
touch backend/app/core/__init__.py backend/app/db/__init__.py
touch backend/app/models/__init__.py backend/app/schemas/__init__.py backend/app/services/__init__.py
docker compose up --build
```

**"SyntaxError: null bytes"** — fichier créé avec PowerShell → recréer avec Git Bash.

**"npm error JSON.parse"** — `package.json` vide :
```bash
cd frontend && npm create vite@latest . -- --template react && npm install && cd ..
docker compose up --build
```

**"failed to prepare extraction snapshot"** — cache Docker corrompu :
```bash
docker compose down && docker builder prune -af && docker system prune -af
docker compose up --build
```

---

## Config VS Code - supprimer les avertissements (optionnel)

```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install fastapi uvicorn pydantic-settings sqlalchemy alembic bcrypt "python-jose[cryptography]" python-multipart httpx email-validator
```

Dans VS Code : `Ctrl+Shift+P` → `Python: Select Interpreter` → `./backend/venv/Scripts/python.exe`

> `venv/` est dans `.gitignore` - chaque développeur le crée sur son PC.