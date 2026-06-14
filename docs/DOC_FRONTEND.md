# Documentation Frontend — Resonate

Stack : **React 19** · **Vite 8** · **React Router 7** · **Chart.js** · **WebSocket natif**

---

## 1. Architecture générale

```
frontend/src/
├── api/          # Services HTTP
├── context/      # État global (Auth, Language, Chat)
├── hooks/        # WebSocket (useNotificationSocket)
├── pages/        # Pages entières accessibles par routes
├── components/   # Composants par pages ou partagés (shared)
└── translations/ # Fichiers de traduction FR/EN catégorisés
```

### Routing (`App.jsx`)
Trois niveaux de routes :
- **Publiques** : login, register, forgot/reset password, mentions légales
- **Guest** (via layout minimaliste pour user non authentifié) : home, albums, search, playlists publiques
- **Authentifiées** (via layout complet pour user authentifié) : mêmes routes que guest + profil, social, library, settings, admin

La route `/admin` est conditionnelle : rendue uniquement si `user?.role === "admin"`.

---

## 2. Layouts

### `AuthLayout`
Layout de l'application quand l'utilisateur est authentifié. Il est séparé en 3 colonnes :

La sidebar de gauche, contient : la UserCard (présentation de l'utilisateur connecté), 
la NavCard (navigation des routes sur l'application), 
la LibraryCard (accès rapide aux playlists et albums de l'utilisateur connecté) 
et le Footer (crédits et mentions légales)

Le conteneur central : c'est ici que le routing se fait grâce au RouterOutlet. S'y affiche le contenu des pages. Au dessus se trouvent la bar de recherche (SearchBar) et partie notifications (NotifsCard).

La Sidebar de droite, contient : FavoritePlaylistCard (affichage de la playlist favorites de l'utilisateur connecté)

Le composant `ChatModal`, qui correspond à la messagerie instantanée, est intégrée sur toutes les pages, au dessus du reste du contenu.

Les notifications en temps réel sont centralisées ici via le hook useNotificationSocket. Les événements sont ensuite injectés dans le ChatContext pour être rendus accessibles à toute l'application.

### `GuestLayout`
En mode invité, le layout ne se fait que sur 2 colonnes.

À gauche : le logo affiché en grand (LogoCard), la NavCard pour la navigation (avec lien vers la connexion), et le LanguageSwitch pour changer de langue. 

Au centre : la SearchBar, le conteneur principal qui reçoit le resultat du routing, et le footer avec les crédits et mentions légales.

---

## 3. Contextes globaux

### `AuthContext`
- Charge le token de l'utilisateur depuis le `localStorage` au montage de l'application et appelle `/auth/me` pour récupérer les informations du user.
- Applique le thème (`data-theme`) **avant** la résolution de `getMe()` pour éviter le flash visuel (sombre/clair).
- La fonction `handleLogin` stocke l'access token et le refresh tokens, la fonction `logout` révoque la connexion côté serveur et vide le localStorage.
- C'est ici que la synchronisation entre le thème BDD et DOM, ainsi que le localStorage se fait à chaque changement de `user.theme`.

### `LanguageContext`
- Initialisation de la langue depuis le `localStorage`, écrasée par `user.language` à la connexion.
- La fonction `toggleLanguage()` sauvegarde dans le localStorage ET en BDD (avec une erreur silencieuse si la BDD échoue, afin de garder le changement de langue visuellement).
- La fonction `t("section.key")` : fonction récursive qui est appelée dans toute l'application où le texte change en fonction de la langue. Permet d'afficher automatiquement la langue sélectionnée.

### `ChatContext`
Partage l'événement WebSocket entrant (`incomingChatEvent`) entre `AuthLayout` et `ChatModal` sans prop drilling.

---

## 4. Système de traductions (i18n)

Les fichiers sont séparés par domaine (`album.js`, `social.js`, `library.js`, `playlist.js`, `layout.js`, `home.js`, `userProfile.js`) et sont importés dans `index.js`.

Les clés sont directement dans `index.js` pour `login`, `register`, `settings`, `forgot`, `reset`, `admin`, `mentionsLegales`, `reviews`.

L'avantage de ces séparations est que chaque développeur gère ses propres clés, pas de conflits de merge, et on gagne surtout en lisibilité.

---

## 5. Couche API (`src/api/`)

Les services permettent de faire les appels vers l'API afin de respecter les SOC (séparation of concerns).

Le but est de rendre les composants les plus simples possibles, pour éviter les problèmes de sécurité vers le back. C"est donc mieux s'ils ne contiennent pas les fetchs API.

### `auth.js` — `authFetch`
Mise en place d'un wrapper autour de `fetch` avec retry automatique sur l'erreur 401 : ça détecte automatiquement l'expiration du JWT, puis appelle `/auth/refresh`, stocke les nouveaux tokens et rejoue la requête originale. Un seul se fait refresh en parallèle grâce à un flag `isRefreshing`.

### Services métier
| Fichier | Responsabilité |
|---|---|
| `api.js` | Bibliothèque, playlists, reviews, likes, commentaires |
| `feed.service.js` | Feed, follows, commentaires feed, likes feed |
| `reviews.service.js` | Like/unlike review, feature/unfeature (admin) |
| `chat.service.js` | Conversations, messages, marquage lu |
| `notification.service.js` | Notifications, compteur non-lus |
| `search.service.js` | Recherche albums, users, playlists |

---

## 6. Pages principales

### `Home`
`HeaderCard` affiche une track aléatoire toutes les 5s via `setInterval` avec animation `slowZoom` CSS. Les tracks sont récupérées dans le cache de la BDD et non sur l'API last.fm pour éviter les fetch intensifs. `SocialCard` affiche le feed en aperçu (sans la partie commentaires).

### `AlbumPage`
Background dynamique = pochette de l'album en plein écran avec `backdrop-filter: blur` pour un rendu moderne. Les boutons de statut (PLANNED/LISTENING/COMPLETED/DROPPED) sont gérés via le composant `AlbumActions`.

La partie commentaires et notes est gérée grâce au composant `ReviewList` qui contient les composants `ReviewForm` et `ReviewCard`.

### `Profile`
Cette page peut s'afficher de 2 manière différentes :
- Mon profil (`/profile`) : affiche le profil de l'utilisateur connecté.
- Le profil d'un autre utilisateur (`/user/:id`) : affiche le profil d'un autre utilisateur que celui connecté.

Pour les différencier et faire le bon affichage, on teste au chargement de la page si le user affiché correspond à celui qui est connecté.
La page profil contient `HeaderCard` avec les informations principales de l'utilisateurs, et la `StatsCard` avec les statistiques (albums et sociales) de l'utilisateur.

### `LibraryPage`
Partie statistique : dashboard avec un graphique Doughnut (fait grâce à Chart.js) pour représenter la répartition des statuts d'écoute des albums.

Utilisation de carousels horizontaux pour l'affichage des albums et playlists préférés. Écoute les événements `playlistUpdated` et `favoriteChanged` pour se rafraîchir.

### `Social`
Feed complet avec scroll infini.

Le composant `SocialItem` est polymorphe, il récupère la donnée et se créer avec le sous-composant (Box) correspondant au type de post (Ajout de track dans une playlist, follow d'un user, etc.).

Possibilité de commenter grâce aux composants `CommentItem` et `NewCommentItem`.

### `Settings`
Page permettant de modifier les informations du profil :
Informations utilisateur (nom, prénom, etc.), changement email/password, toggle email_notifications pour accepter de reçevoir ou non les notifications par mail, export RGPD (JSON & CSV) et bouton de suppression de compte.

### `AdminPage`
3 onglets : signalements (reviews et utilisateurs, filtrables), Coups de cœur, Utilisateurs. Permet de gérer les signalement que les utilisateurs ont fait, de bannir un utilisateur, ou de supprimer des messages.

---

## 7. Composants clés

### `SocialItem` + variations
Le pattern `CONTENT_COMPONENTS` permet d'y mapper le composant en fonction de `activity.type` (`PlaylistBox`, `AlbumStatusBox`, `AlbumReviewBox`, `UserFollowBox`).

### `ReviewCard`
Inline editing : le user peut modifier son texte directement sur le commentaire (formulaire dans la carte). Utilisation d'une modale `confirm-modal` pour la suppression et le signalement de commentaire (évite de cliquer trop vite).
Présence du badge coup de coeur pour les admins.

### `HeaderCard` (profil)
`FollowUsersListModal` pour voir followers et following quand on clique dessus.
Modale de signalement utilisateur avec textarea pour la raison du signalement.
Feedback succès/erreur inline pour une meilleure experience UX.

### `NotifsCard` + `NotifsModal`
Le compteur de notifications non-lues est persisté dans le `localStorage` pour éviter d'afficher le badge en cas de notifications non lues à chaque refresh (si le user a déjà ouvert la modale).
Le badge est sur les notifications ET sur les messages. Le bouton admin est conditionnel : ne s'affiche que si le user est un admin.

### `ChatModal`
La fenêtre est fixe en bas à droite au dessus du reste du contenu.
Elle peut se refermée et n'apparaitre que sous forme d'une petite barre.
A l'ouverture, elle contient 3 vues : liste des conversations, nouvelle conversation (amis mutuels uniquement), et conversation active.
Tout est en temps réel grâce auz websockets (réception de message, affichage des mentions "lu" et "modifié")

### `Carousel`
Utilisation d'un scroll horizontal avec `useRef` + `scrollBy`.
Les boutons ← → sont positionnés en `absolute` hors du flux.

---

## 8. WebSocket (`useNotificationSocket.js`)

Connexion sur `wss://localhost/api/v1/ws`. Permet une connexion et une écoute persistante entre l'utilisateur et le serveur.
L'authentification se fait via le premier message JSON (token JWT, permet de gagner en sécurité plutôt que de transporter le token dans l'URL).

Gestion des événements : `new_message` → entrain un update de ChatModal, `notification` → entrain un update de NotifsCard.

Fermeture propre avec code 1000 au démontage.

---

## 9. Thème & Persistance UI

### Thème sombre/clair
Géré grâce aux variables CSS qui se trouvent dans `index.css`.
Le thème dark s'applique sur `:root` et le thème light s'applique sur `[data-theme="light"]`.

L'application du thème se fait via `document.documentElement.setAttribute("data-theme", theme)` avant tout appel réseau pour éviter le flash visuel entre light et dark.

### Persistance
- `localStorage` : permet la persistance des tokens, des refresh_tokens, du theme choisi, et de la langue choisie.
- BDD : permet la persistance du theme, du language choisi, des préférences au niveau des email_notifications (synchronisés au PATCH /users/me).

### Fix autofill Chrome
`index.css` surcharge `input:-webkit-autofill` avec `box-shadow inset` pour maintenir la couleur sombre sur les champs auto-remplis.

---

## 10. Points de conception notables

- **`createPortal`** : non utilisé finalement, les dropdowns avatar sont gérés avec `position: fixed` + `z-index`.
- **Proxy image** : toutes les images Last.fm passent par `/api/v1/image-proxy` pour éviter attaques CORS et mixed content.

