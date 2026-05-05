# Resonate — Documentation Dev A

> **Développeur :** Anthony
> **Rôle :** Sécurité & Infrastructure
> **Projet :** Resonate — Réseau social musical
> **École :** SUPINFO

---

## 🎯 Mon rôle dans le projet

Dans l'équipe Resonate, je suis en charge de la **sécurité et de l'infrastructure**.
Concrètement, ça veut dire que c'est moi qui m'occupe de tout ce qui tourne autour de :

- La mise en place de Docker pour faire tourner le projet en local
- Le système de connexion et d'inscription des utilisateurs
- La sécurité des mots de passe et des tokens JWT
- La connexion via Google et GitHub (OAuth2)
- La page de paramètres utilisateur
- La documentation technique du projet

Mon travail est la **base sur laquelle les autres membres de l'équipe s'appuient** pour développer leurs fonctionnalités (API musicale, bibliothèque, feed social).

---

## 🏗️ Infrastructure Docker

La première chose qu'on a mise en place, c'est l'environnement de travail.
L'objectif était simple : n'importe qui dans l'équipe doit pouvoir lancer le projet avec une seule commande, sans installer quoi que ce soit sur son PC.

**On a mis en place 4 services Docker :**

| Service | Rôle | Port |
|---|---|---|
| `db` | Base de données PostgreSQL | 5432 |
| `backend` | API FastAPI (Python) | 8000 |
| `frontend` | Interface React + Vite | 5173 |
| `pgadmin` | Interface visuelle pour la BDD | 5050 |

**La commande pour tout lancer :**
```bash
docker compose up --build
```

On a aussi mis en place un **healthcheck** sur la base de données — ça veut dire que le backend attend que PostgreSQL soit vraiment prêt avant de démarrer, évitant les erreurs de connexion au lancement.

Pour aller plus loin → voir `README.Docker.md`

---

## 🗄️ Base de données

On travaille avec **PostgreSQL**. Toutes les données des utilisateurs sont stockées dans deux tables principales.

### Table `users` — la table principale

C'est la table centrale du projet. Elle contient toutes les informations d'un utilisateur :

```
id              → identifiant unique (UUID)
email           → adresse email de connexion
hashed_password → mot de passe hashé (jamais en clair)
username        → nom d'utilisateur affiché
role            → "user" ou "admin"
is_active       → compte actif ou banni
created_at      → date de création

avatar_url      → URL de la photo de profil
bio             → présentation de l'utilisateur
website         → lien vers son site perso
theme           → préférence Dark ou Light mode
```

### Table `oauth_accounts` — pour Google et GitHub

Quand un utilisateur se connecte via Google ou GitHub, ses infos sont stockées ici et liées à son compte Resonate.

Pour aller plus loin → voir `README.Guide.BDD.md`

---

## 🔐 Authentification

C'est le coeur de mon travail. On a mis en place un système d'authentification complet.

### Inscription

L'utilisateur remplit un formulaire en **2 étapes** :
- Étape 1 : identifiant, email, mot de passe
- Étape 2 : nom, prénom, date de naissance, photo de profil

Le mot de passe est **hashé avec bcrypt** avant d'être stocké — même si quelqu'un vole la base de données, il ne peut pas retrouver les vrais mots de passe.

### Connexion classique

L'utilisateur entre son email et son mot de passe. Le système vérifie le hash bcrypt et génère un **token JWT** valable 30 minutes. Ce token est stocké dans le navigateur et envoyé à chaque requête pour prouver que l'utilisateur est bien connecté.

### Connexion via Google / GitHub (OAuth2)

On a intégré la connexion en un clic via Google et GitHub. Le système gère automatiquement 3 cas :
- Nouvel utilisateur → création du compte
- Utilisateur existant via OAuth → connexion directe
- Utilisateur existant via email → liaison du compte OAuth

### Mot de passe oublié

L'utilisateur entre son email, reçoit un lien par mail, clique dessus et choisit un nouveau mot de passe. Le lien expire après 1 heure pour des raisons de sécurité. Les emails sont envoyés via **Gmail SMTP**.

Pour aller plus loin → voir `README.AuthSettings.md` et `README.Mail.md`

---

## 🛡️ Sécurité & Middleware

On a mis en place 3 niveaux d'accès dans l'API :

**Accès public** — tout le monde peut accéder (non connecté)
**Accès user** — réservé aux utilisateurs connectés (token JWT valide)
**Accès admin** — réservé aux administrateurs (role = "admin" en BDD)

Chaque route de l'API est protégée selon son niveau. Si quelqu'un essaie d'accéder à une route sans les droits nécessaires, il reçoit une erreur 401 ou 403.

Pour aller plus loin → voir `README.Middleware.md`

---

## ⚙️ Page Settings — Paramètres utilisateur

Une fois connecté, l'utilisateur peut accéder à sa page de paramètres pour :

- **Modifier son profil** — photo, bio, site web
- **Changer le thème** — Dark Mode ou Light Mode, sauvegardé en base de données
- **Télécharger ses données** — export JSON de toutes ses infos personnelles (obligation légale RGPD en Europe)

Le thème choisi est mémorisé en base de données — si l'utilisateur se reconnecte depuis un autre appareil, son thème est automatiquement appliqué.

Pour aller plus loin → voir `README.AuthSettings.md`

---

## 🌍 Traduction FR / EN

Toutes les pages de l'application sont disponibles en français et en anglais. Un petit bouton drapeau en haut à droite de chaque page permet de basculer entre les deux langues instantanément.

---

## 📡 API — Les routes créées

Voici un résumé des routes que j'ai développées :

**Authentification :**
```
POST  /api/v1/auth/register        → Créer un compte
POST  /api/v1/auth/login           → Se connecter
GET   /api/v1/auth/me              → Infos de l'utilisateur connecté
GET   /api/v1/auth/admin-test      → Test accès admin
POST  /api/v1/auth/forgot-password → Envoyer un email de reset
POST  /api/v1/auth/reset-password  → Changer le mot de passe
```

**OAuth2 :**
```
GET   /api/v1/oauth/google/login    → Connexion Google
GET   /api/v1/oauth/google/callback → Retour Google
GET   /api/v1/oauth/github/login    → Connexion GitHub
GET   /api/v1/oauth/github/callback → Retour GitHub
```

**Profil utilisateur :**
```
GET   /api/v1/users/me         → Récupérer le profil complet
PATCH /api/v1/users/me         → Modifier le profil
GET   /api/v1/users/me/export  → Télécharger ses données (RGPD)
```

Pour tester toutes ces routes → voir `README.API.md`

---

## 🖥️ Interface utilisateur

Côté frontend, j'ai développé les pages suivantes en React :

| Page | Route | Accès |
|---|---|---|
| Connexion | `/login` | Public |
| Inscription | `/register` | Public |
| Mot de passe oublié | `/forgot-password` | Public |
| Réinitialisation mdp | `/reset-password` | Public (lien email) |
| Callback OAuth | `/oauth/callback` | Automatique |
| Paramètres | `/settings` | Connecté uniquement |

Toutes les pages suivent le **design Figma** d'Élisa — fond sombre, style glassmorphism, logo Resonate en haut.

---

## 📐 Diagramme UML

J'ai réalisé un diagramme UML Cas d'utilisation qui représente visuellement qui peut faire quoi dans l'application selon son rôle :

- **Visiteur** — accès limité aux pages publiques
- **User** — accès complet aux fonctionnalités personnelles
- **Admin** — accès à la gestion des utilisateurs

Pour comprendre le diagramme → voir `README.UML.md`

---

## 📦 Technologies utilisées

| Technologie | Usage |
|---|---|
| Docker + Docker Compose | Environnement de développement |
| FastAPI (Python) | API backend |
| PostgreSQL | Base de données |
| SQLAlchemy (async) | Communication Python ↔ BDD |
| React + Vite | Interface utilisateur |
| JWT (JSON Web Token) | Authentification stateless |
| bcrypt | Hash des mots de passe |
| OAuth2 | Connexion Google + GitHub |
| aiosmtplib | Envoi d'emails asynchrone |
| pgAdmin | Interface visuelle BDD |

---

## 📁 Structure des fichiers

```
projet_resonate/
├── backend/
│   └── app/
│       ├── api/v1/
│       │   ├── auth.py       ← routes authentification
│       │   ├── oauth.py      ← routes OAuth2
│       │   └── users.py      ← routes profil
│       ├── core/
│       │   ├── config.py     ← variables d'environnement
│       │   └── dependencies.py ← middlewares JWT
│       ├── models/
│       │   ├── user.py       ← table users
│       │   └── oauth_account.py ← table oauth_accounts
│       ├── schemas/
│       │   └── auth.py       ← validation des données
│       ├── services/
│       │   ├── auth.py       ← logique bcrypt + JWT
│       │   ├── oauth.py      ← logique Google + GitHub
│       │   └── email.py      ← envoi emails
│       └── main.py           ← application FastAPI
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── auth.js       ← appels API
│       ├── components/
│       │   └── LanguageSwitch.jsx ← bouton FR/EN
│       ├── context/
│       │   ├── AuthContext.jsx    ← état global auth
│       │   └── LanguageContext.jsx ← état global langue
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── OAuthCallback.jsx
│       │   └── Settings.jsx
│       ├── translations/
│       │   └── index.js      ← textes FR + EN
│       └── App.jsx           ← routes React
│
├── pgadmin-servers.json      ← config pgAdmin auto
└── docker-compose.yml        ← orchestration Docker
```

---

## ✅ Récapitulatif de ce qui a été livré

| Fonctionnalité | Statut |
|---|---|
| Infrastructure Docker complète | ✅ |
| Base de données PostgreSQL + pgAdmin | ✅ |
| Inscription (2 étapes + validation) | ✅ |
| Connexion email + mot de passe | ✅ |
| Connexion Google OAuth2 | ✅ |
| Connexion GitHub OAuth2 | ✅ |
| Réinitialisation mot de passe par email | ✅ |
| Système de tokens JWT | ✅ |
| Middlewares de sécurité (user / admin) | ✅ |
| Page Settings — profil + thème + RGPD | ✅ |
| Traduction FR / EN sur toutes les pages | ✅ |
| Diagramme UML Cas d'utilisation | ✅ |
| Documentation complète | ✅ |
