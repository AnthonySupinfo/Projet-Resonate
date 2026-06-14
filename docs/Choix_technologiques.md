# Justification des choix technologiques

## Frontend

| Technologie | Version |
|---|---|
| React | 19 |
| Vite | 8 |
| React Router | 7 |
| Chart.js | — |
| WebSocket | natif navigateur |

### React 19 + Vite 8
React a été choisi pour sa gestion efficace de l'état local et son écosystème mature, particulièrement adapté à une application avec de nombreuses interactions temps réel (notifications, messagerie, fil d'actualité). Vite offre un environnement de développement rapide et des builds optimisés, sans la complexité de configuration de Webpack.

### React Router 7
Permet une navigation côté client fluide avec gestion des routes protégées (utilisateurs authentifiés vs invités), essentielle pour respecter la consigne d'accès public aux contenus sans compte.

### Chart.js
Utilisé pour la visualisation des statistiques de la bibliothèque personnelle (répartition des statuts d'albums). Léger et simple à intégrer dans un contexte React sans alourdir le bundle.

### WebSocket natif
Choisi pour la messagerie instantanée et les notifications temps réel, en cohérence avec le backend FastAPI qui expose directement un endpoint WebSocket. L'utilisation de l'API native du navigateur évite l'ajout d'une dépendance externe (socket.io) pour un besoin couvert nativement.

---

## Backend

| Technologie | Version |
|---|---|
| FastAPI | Python 3.12 |
| PostgreSQL | 16 |
| SQLAlchemy | 2.0 async |
| Auth | JWT + Refresh Token |
| WebSocket | intégré FastAPI |

### FastAPI (Python 3.12)
FastAPI a été retenu pour ses performances élevées grâce au support natif de l'asynchrone (`async/await`), indispensable pour gérer simultanément les appels à l'API Last.fm, les requêtes base de données et les connexions WebSocket sans bloquer le serveur. Sa validation automatique via Pydantic réduit le code boilerplate et sécurise les entrées utilisateur.

### PostgreSQL 16
Base de données relationnelle robuste, choisie pour la richesse des relations entre entités (utilisateurs, albums, playlists, reviews, notifications). Les contraintes d'unicité et les cascades de suppression sont exploitées directement au niveau du schéma pour garantir l'intégrité des données.

### SQLAlchemy 2.0 async
ORM moderne permettant des requêtes asynchrones natives, en cohérence avec FastAPI. La syntaxe `select()` déclarative améliore la lisibilité et la maintenabilité des requêtes complexes (jointures, agrégations pour les stats).

### JWT + Refresh Token
Authentification stateless via access token de courte durée (15 min) couplé à un refresh token opaque persisté en base, permettant la rotation sécurisée des sessions et la révocation complète à la déconnexion.

### WebSocket (intégré à FastAPI)
Utilisé pour les notifications temps réel et la messagerie privée, sans dépendance externe supplémentaire. Le gestionnaire de connexions centralisé permet de cibler précisément les utilisateurs connectés.

---

## API tierce — Last.fm

Last.fm a été choisie parmi les APIs musicales disponibles pour sa large couverture de métadonnées (titres, artistes, tags de genre, dates de sortie, images) et son accès gratuit sans limite stricte pour un usage académique. L'application l'utilise exclusivement via le backend conformément aux consignes, avec un système de cache local permettant de limiter les appels redondants et d'enrichir progressivement les données disponibles pour le filtrage.
