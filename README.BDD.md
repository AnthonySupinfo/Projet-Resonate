# Schéma Base de Données — Resonate

## Vue d'ensemble

La base de données PostgreSQL de Resonate contient **15 tables** organisées en 4 groupes fonctionnels. Le fichier `Resonate_BDD_v3.drawio` contient le diagramme visuel complet, ouvrable avec [draw.io](https://app.diagrams.net/).

---

## Légende des couleurs

| Couleur | Groupe | Responsable |
|---------|--------|-------------|
| 🟠 Corail `#F49390` | Auth & Sécurité | Anthony (Dev A) |
| 🔵 Bleu `#82bcff` | Musique & API Last.fm | Krishna |
| 🟢 Vert `#6ee7b7` | Reviews & Interactions | Mélissa |
| 🟣 Violet `#c0aede` | Playlists & Bibliothèque | Mélissa |

---

## 🟠 Auth & Sécurité (Anthony)

### `users` — Table centrale

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | VARCHAR | PK, UUID auto | Identifiant unique |
| `email` | VARCHAR | UNIQUE, INDEX | Adresse email |
| `hashed_password` | VARCHAR | NULL | Hash bcrypt (NULL pour OAuth) |
| `username` | VARCHAR | UNIQUE, INDEX | Nom d'utilisateur (3-20 chars) |
| `role` | VARCHAR | défaut `"user"` | `"user"` ou `"admin"` |
| `is_active` | BOOLEAN | défaut `TRUE` | Compte actif ou banni |
| `created_at` | TIMESTAMP | auto | Date de création |
| `first_name` | VARCHAR | NULL | Prénom |
| `last_name` | VARCHAR | NULL | Nom |
| `birth_date` | DATE | NULL | Date de naissance |
| `avatar_url` | VARCHAR | NULL | Emoji ou URL classique |
| `bio` | TEXT | NULL | Biographie |
| `website` | VARCHAR | NULL | Site web personnel |
| `theme` | VARCHAR | défaut `"dark"` | `"dark"` ou `"light"` |

### `oauth_accounts` — Comptes OAuth liés

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | VARCHAR | PK, UUID auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Utilisateur lié |
| `provider` | VARCHAR | | `"google"` ou `"github"` |
| `provider_user_id` | VARCHAR | | ID chez le provider |
| `provider_email` | VARCHAR | | Email chez le provider |

### `refresh_tokens` — Sessions persistantes ✨ NOUVEAU

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | VARCHAR | PK, UUID auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Propriétaire du token |
| `token` | VARCHAR | UNIQUE, INDEX | Chaîne aléatoire 128 chars |
| `expires_at` | TIMESTAMP | | Expiration (now + 60 min) |
| `created_at` | TIMESTAMP | auto | Date de création |
| `revoked` | BOOLEAN | défaut `FALSE` | Révoqué après utilisation |

---

## 🔵 Musique (Krishna)

### `albums` — Albums musicaux

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | UUID | PK, auto | Identifiant unique |
| `name` | VARCHAR | | Nom de l'album |
| `title` | VARCHAR | NULL | Titre alternatif |
| `artist_name` | VARCHAR | | Nom de l'artiste |
| `lastfm_url` | VARCHAR | UNIQUE, INDEX | URL Last.fm |
| `fetched_at` | TIMESTAMP | NULL | Dernière récupération API |
| `created_at` | TIMESTAMP | auto | Date de création |

### `tracks` — Pistes musicales

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | UUID | PK, auto | Identifiant unique |
| `album_id` | UUID | FK → `albums.id` CASCADE | Album parent |
| `name` | VARCHAR | | Nom de la piste |
| `position` | INTEGER | NULL | Numéro de piste |
| `duration` | INTEGER | NULL | Durée en secondes |
| `created_at` | TIMESTAMP | auto | Date de création |

### `artists` — Artistes

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | UUID | PK, auto | Identifiant unique |
| `name` | VARCHAR | UNIQUE, INDEX | Nom de l'artiste |
| `lastfm_url` | VARCHAR | UNIQUE, INDEX | URL Last.fm |
| `fetched_at` | TIMESTAMP | NULL | Dernière récupération API |
| `created_at` | TIMESTAMP | auto | Date de création |

### `album_search_cache` — Cache de recherche

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | UUID | PK, auto | Identifiant unique |
| `query` | VARCHAR | UNIQUE, INDEX | Terme de recherche |
| `results` | JSON | | Résultats Last.fm en JSON |
| `fetched_at` | TIMESTAMP | NULL | Date de récupération |
| `created_at` | TIMESTAMP | auto | Date de création |

---

## 🟢 Reviews & Interactions (Mélissa)

### `reviews` — Critiques d'albums

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Auteur |
| `album_id` | UUID | FK → `albums.id` CASCADE | Album critiqué |
| `rating` | INTEGER | CHECK 0-5 | Note de 0 à 5 |
| `content` | TEXT | NULL | Contenu de la critique |
| `has_been_modified` | BOOLEAN | défaut `FALSE` | Modifiée après publication |
| `posted_at` | TIMESTAMP | auto | Date de publication |
| `updated_at` | TIMESTAMP | auto | Dernière modification |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

Contrainte : `UNIQUE (user_id, album_id)` — une seule review par utilisateur par album.

### `review_comments` — Commentaires sur les reviews

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `review_id` | INTEGER | FK → `reviews.id` CASCADE | Review commentée |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Auteur du commentaire |
| `content` | TEXT | | Contenu du commentaire |
| `has_been_modified` | BOOLEAN | défaut `FALSE` | Modifié |
| `created_at` | TIMESTAMP | auto | Date de création |
| `updated_at` | TIMESTAMP | auto | Dernière modification |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

### `review_likes` — Likes sur les reviews

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `user_id` | VARCHAR | PK, FK → `users.id` CASCADE | Utilisateur qui like |
| `review_id` | INTEGER | PK, FK → `reviews.id` CASCADE | Review likée |
| `created_at` | TIMESTAMP | auto | Date du like |

Clé primaire composite `(user_id, review_id)` — un seul like par utilisateur par review.

### `reports` — Signalements de reviews

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `reporter_id` | VARCHAR | FK → `users.id` CASCADE | Qui signale |
| `review_id` | INTEGER | FK → `reviews.id` CASCADE | Review signalée |
| `reason` | TEXT | | Motif du signalement |
| `status` | ENUM | défaut `PENDING` | `PENDING` / `RESOLVED` / `DISMISSED` |
| `created_at` | TIMESTAMP | auto | Date du signalement |
| `reviewed_by_id` | VARCHAR | FK → `users.id` SET NULL | Admin qui a traité |
| `resolved_at` | TIMESTAMP | NULL | Date de résolution |

---

## 🟣 Playlists & Bibliothèque (Mélissa)

### `playlists` — Playlists utilisateur

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Créateur |
| `type` | ENUM | | `DEFAULT` / `CUSTOM` / `ORIGINAL` |
| `name` | VARCHAR(255) | | Nom de la playlist |
| `cover_url` | VARCHAR(512) | NULL | Image de couverture |
| `description` | TEXT | NULL | Description |
| `is_public` | BOOLEAN | défaut `FALSE` | Visible par tous |
| `created_at` | TIMESTAMP | auto | Date de création |
| `deleted_at` | TIMESTAMP | NULL | Soft delete |

### `user_playlist_items` — Pistes dans les playlists

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `playlist_id` | INTEGER | FK → `playlists.id` CASCADE | Playlist |
| `track_id` | UUID | FK → `tracks.id` CASCADE | Piste ajoutée |
| `added_at` | TIMESTAMP | auto | Date d'ajout |

Contrainte : `UNIQUE (playlist_id, track_id)` — une piste ne peut être ajoutée qu'une fois par playlist.

### `user_album_status` — Statut d'écoute des albums

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Utilisateur |
| `album_id` | UUID | FK → `albums.id` CASCADE | Album |
| `status` | ENUM | | `PLANNED` / `LISTENING` / `COMPLETED` / `DROPPED` |
| `updated_at` | TIMESTAMP | auto | Dernière mise à jour |

Contrainte : `UNIQUE (user_id, album_id)` — un seul statut par utilisateur par album.

### `user_playlist_status` — Statut d'écoute des playlists

| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, auto | Identifiant unique |
| `user_id` | VARCHAR | FK → `users.id` CASCADE | Utilisateur |
| `playlist_id` | INTEGER | FK → `playlists.id` CASCADE | Playlist |
| `status` | ENUM | | `PLANNED` / `LISTENING` / `COMPLETED` / `DROPPED` |
| `updated_at` | TIMESTAMP | auto | Dernière mise à jour |

Contrainte : `UNIQUE (user_id, playlist_id)` — un seul statut par utilisateur par playlist.

---

## Relations principales

```
users ──1:N──→ oauth_accounts       (un user peut avoir plusieurs comptes OAuth)
users ──1:N──→ refresh_tokens       (un user peut avoir plusieurs sessions)
users ──1:N──→ reviews              (un user peut écrire plusieurs reviews)
users ──1:N──→ review_comments      (un user peut commenter plusieurs fois)
users ──1:N──→ playlists            (un user peut créer plusieurs playlists)
users ──1:N──→ user_album_status    (un user suit plusieurs albums)
users ──1:N──→ user_playlist_status (un user suit plusieurs playlists)

albums ──1:N──→ tracks              (un album contient plusieurs pistes)
albums ──1:N──→ reviews             (un album peut recevoir plusieurs reviews)
albums ──1:N──→ user_album_status   (un album est suivi par plusieurs users)

reviews ──1:N──→ review_comments    (une review peut avoir plusieurs commentaires)
reviews ──1:N──→ review_likes       (une review peut avoir plusieurs likes)
reviews ──1:N──→ reports             (une review peut être signalée plusieurs fois)

playlists ──1:N──→ user_playlist_items  (une playlist contient plusieurs pistes)
playlists ──1:N──→ user_playlist_status (une playlist est suivie par plusieurs users)

tracks ──1:N──→ user_playlist_items (une piste peut être dans plusieurs playlists)
```

---

## Particularités techniques

**Soft delete** : les tables `reviews`, `review_comments` et `playlists` utilisent un champ `deleted_at` au lieu de supprimer réellement les lignes. Quand `deleted_at` est `NULL`, l'entrée est active. Quand elle a une date, elle est considérée supprimée.

**Clés primaires composites** : `review_likes` utilise `(user_id, review_id)` comme clé primaire composite, garantissant un seul like par utilisateur par review sans besoin de contrainte supplémentaire.

**Cascade DELETE** : toutes les FK utilisent `ondelete="CASCADE"` sauf `reports.reviewed_by_id` qui utilise `SET NULL` (pour garder le signalement même si l'admin est supprimé).

**Contraintes UNIQUE** : `user_album_status`, `user_playlist_status`, `user_playlist_items` et `reviews` ont des contraintes d'unicité composites pour empêcher les doublons logiques.
