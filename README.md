# Guide d'installation & de lancement — Resonate

> Réseau social musical — Projet SUPCONTENT · SUPINFO 2026  
> Équipe : Anthony · Krishna · Mélissa · Élisa

---

## Récupérer le projet

### Option 1 — Fichier ZIP (rendu officiel)

Le projet est livré sous forme de fichier ZIP. Il suffit de le décompresser :

```
Resonate.zip
└── Projet-Resonate/
    ├── backend/
    ├── frontend/
    ├── nginx/
    ├── docker-compose.yml
    ├── generate-certs.sh
    └── ...
```

Décompresser puis ouvrir un terminal dans le dossier `Projet-Resonate/`.

### Option 2 — GitHub (backup)

```bash
git clone https://github.com/AnthonySupinfo/Projet-Resonate.git
cd Projet-Resonate
```

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

| Outil | Version minimum | Lien |
|---|---|---|
| **Docker Desktop** | 4.x | https://www.docker.com/products/docker-desktop |
| **mkcert** | 1.4+ | https://github.com/FiloSottile/mkcert#installation |
| **Git** | 2.x (option GitHub uniquement) | https://git-scm.com |

**Installation de mkcert :**
```bash
# Windows (Chocolatey)
choco install mkcert

# macOS (Homebrew)
brew install mkcert

# Linux
apt install mkcert
```

---

## Étape 1 — Créer les fichiers `.env`

Le projet nécessite **deux fichiers `.env`**. Ces fichiers contiennent des informations sensibles (mots de passe, clés API, secrets) et ne sont donc **pas committés dans le dépôt Git pour des raisons de sécurité**.

> 📄 **Toutes les valeurs à renseigner se trouvent dans le document Word fourni séparément avec le projet.** Ce document contient l'intégralité des identifiants, mots de passe, clés API et secrets nécessaires — y compris la clé Last.fm prête à l'emploi.

### `backend/.env`

Créer le fichier `backend/.env` :

```env
# Base de données
POSTGRES_USER=resonate_user
POSTGRES_PASSWORD=<voir doc Word>
POSTGRES_DB=resonate
DATABASE_URL=postgresql+asyncpg://resonate_user:<PASSWORD>@db:5432/resonate

# JWT
JWT_SECRET_KEY=<voir doc Word>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=60

# Environnement
ENVIRONMENT=development
FRONTEND_URL=https://localhost

# OAuth Google
GOOGLE_CLIENT_ID=<voir doc Word>
GOOGLE_CLIENT_SECRET=<voir doc Word>

# OAuth GitHub
GITHUB_CLIENT_ID=<voir doc Word>
GITHUB_CLIENT_SECRET=<voir doc Word>

# Last.fm
LASTFM_API_KEY=<voir doc Word>
LASTFM_API_SECRET=<voir doc Word>

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<voir doc Word>
MAIL_PASSWORD=<voir doc Word>
MAIL_FROM=<voir doc Word>

# pgAdmin
PGADMIN_DEFAULT_EMAIL=<voir doc Word>
PGADMIN_DEFAULT_PASSWORD=<voir doc Word>
```

### `frontend/.env`

Créer le fichier `frontend/.env` :

```env
VITE_API_BASE_URL=https://localhost
VITE_API_URL=https://localhost
```

---

## À propos de la clé API Last.fm

Last.fm est l'API qui fournit toutes les métadonnées musicales (albums, artistes, pochettes, pistes). Elle est **gratuite** et ne nécessite pas de carte bancaire.

> ✅ **Une clé Last.fm fonctionnelle est déjà fournie dans le document Word.** Vous pouvez l'utiliser directement sans créer de compte.

Si toutefois vous souhaitez créer votre propre clé :
1. Aller sur https://www.last.fm/api/account/create
2. Se connecter ou créer un compte Last.fm
3. Remplir le formulaire (nom : `Resonate`, callback : `https://localhost`)
4. Récupérer la **API key** et le **Shared secret**

---

## Étape 2 — Générer les certificats HTTPS

Le script `generate-certs.sh` automatise la création des certificats HTTPS locaux via **mkcert**.

**Ce que fait le script :**
1. Vérifie que `mkcert` est installé
2. Installe une autorité de certification locale dans votre navigateur — les certificats seront reconnus comme valides, sans avertissement de sécurité
3. Crée le dossier `nginx/certs/` si absent
4. Génère le certificat et la clé privée pour `localhost` et `127.0.0.1`

**Lancement :**
```bash
# macOS / Linux
bash generate-certs.sh

# Windows (Git Bash)
bash generate-certs.sh
```

Résultat attendu :
```
Generation des certificats HTTPS...
Termine ! Certificats crees dans nginx/certs/
Vous pouvez maintenant lancer : docker compose up --build
```

> ⚠️ Si mkcert demande un mot de passe système lors de l'installation, c'est normal — acceptez.

---

## Étape 3 — Lancer les tests (optionnel)

Pour vérifier que l'environnement Python est fonctionnel avant le lancement :

```bash
cd backend
pip install pytest pytest-asyncio --break-system-packages
python -m pytest tests/ -v
```

Résultat attendu : **20 tests passants**

```
tests/Test_anthony.py .....   [ 25%]
tests/Test_elisa.py   .....   [ 50%]
tests/Test_krishna.py .....   [ 75%]
tests/Test_melissa.py .....   [100%]
====== 20 passed ======
```

---

## Étape 4 — Lancer le projet

```bash
docker compose up --build
```

Le premier démarrage télécharge les images Docker et installe les dépendances — quelques minutes sont nécessaires.

**Arrêter le projet :**
```bash
docker compose down
```

**Rebuild complet (si modification de la BDD) :**
```bash
docker compose down -v && docker compose up --build
```

---

## Accès aux services

Une fois le projet lancé :

| Service | URL | Description |
|---|---|---|
| 🎵 **Application** | https://localhost | Interface principale Resonate |
| 🔐 **Connexion** | https://localhost/login | Page de connexion |
| 📝 **Inscription** | https://localhost/register | Créer un compte |
| ⚙️ **API REST** | https://localhost/api/v1 | Backend FastAPI |
| 📖 **Documentation API** | https://localhost/docs | Swagger UI (mode développement) |
| 🗄️ **pgAdmin** | http://localhost:5050 | Interface d'administration BDD |

> Les identifiants pgAdmin se trouvent dans le **document Word fourni séparément**.

---

## Passer un utilisateur en administrateur

Pour accéder au panel de modération, il faut élever un compte au rôle `admin`.

**1. Ouvrir pgAdmin** → http://localhost:5050  
**2. Se connecter** avec les identifiants du document Word  
**3. Naviguer vers :** Servers → Resonate → Databases → resonate → Schemas → public  
**4. Ouvrir le Query Tool** (icône SQL en haut) et exécuter :

```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

**5. Vérifier le résultat :**
```sql
SELECT id, email, username, role, is_active FROM users;
```

**6. Se reconnecter** à l'application — le bouton 🛡️ Admin apparaît dans la barre de navigation en haut à droite.

---

## Pour aller plus loin

Pour découvrir toutes les fonctionnalités de l'application, nous vous invitons à consulter les documents fournis avec le projet :

- 📘 **Manuel Utilisateur** — Inscription, bibliothèque musicale, critiques, social, profil, export RGPD
- 🛡️ **Manuel Administrateur** — Panel de modération, coups de cœur, gestion des utilisateurs

Ces guides sont disponibles dans les fichiers `Manuel_Utilisateur_Resonate.docx` joints au rendu.

---

*Resonate — Projet SUPCONTENT · SUPINFO · Juin 2026*
