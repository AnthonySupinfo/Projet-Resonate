# Comprendre le Diagramme UML Cas d'utilisation

### Les Acteurs

Dans Resonate on a 3 acteurs :

| Acteur | Couleur | Description |
|---|---|---|
| **Visiteur** | 🔵 Bleu | Personne non connectée - accès limité |
| **User** | 🟢 Vert | Personne connectée - accès complet |
| **Admin** | 🟠 Orange | Personne avec droits d'administration |

---

### Les Cas d'utilisation (les ellipses)

Chaque **ellipse** (ovale) représente **une action que l'utilisateur peut faire** dans l'application.

Exemples :
```
( Se connecter )           ← l'utilisateur peut faire ça
( Modifier son avatar )    ← l'utilisateur peut faire ça
( Télécharger ses données) ← l'utilisateur peut faire ça
```

---

### La Frontière système (le grand rectangle)

Le grand rectangle bleu s'appelle la **frontière système**.

- Tout ce qui est **à l'intérieur** → fait partie de l'application Resonate
- Les acteurs sont **à l'extérieur** → ils interagissent avec le système

---

### Les Associations (les lignes pleines)

Une ligne pleine entre un acteur et une ellipse signifie :

> **"Cet acteur peut faire cette action"**

```
Visiteur - ( Se connecter )
```
→ Le Visiteur peut se connecter.

---

## Les relations spéciales



### `<<include>>` - La relation d'inclusion

**Signification :** Quand on fait l'action A, on fait **toujours** l'action B en même temps. B est obligatoire.

**Dans Resonate :**
```
( Mot de passe oublié ) ---<<include>>--→ ( Réinitialiser le mot de passe )
```

**Analogie simple :**
```
( Retirer de l'argent au DAB ) ---<<include>>--→ ( Vérifier le solde )
```
→ Quand tu retires de l'argent, le distributeur vérifie TOUJOURS ton solde. C'est obligatoire.

---

### `<<extend>>` - La relation d'extension

**Signification :** L'action B est une **option supplémentaire** de l'action A. Elle n'est pas obligatoire.

**Dans Resonate :**
```
( Se connecter via Google/GitHub ) ---<<extend>>--→ ( Se connecter )
```
**Analogie simple :**
```
( Payer ) ---<<extend>>--→ ( Payer par carte )
```
→ Payer par carte est une OPTION pour payer. On peut aussi payer en espèces. Ce n'est pas obligatoire.

---

### `——▷ hérite` - La relation d'héritage

**Signification :** L'acteur B peut faire **tout ce que fait l'acteur A**, en plus de ses propres actions.

**Dans Resonate :**
```
User ——▷ Visiteur
```
→ Le User peut faire tout ce que fait le Visiteur (voir l'accueil, changer la langue...) PLUS ses propres actions (modifier profil, se déconnecter...).

```
Admin ——▷ User
```
→ L'Admin peut faire tout ce que fait le User PLUS ses propres actions (gérer les comptes, accéder au panel admin...).

**En résumé :**
```
Visiteur ⊂ User ⊂ Admin
```
→ Les droits s'accumulent de gauche à droite.

---

## Lecture du diagramme Resonate

### 🔵 Section Visiteur (en haut - bleu)

Ce sont les actions accessibles **sans être connecté** :

| Action | Description |
|---|---|
| Voir la page d'accueil | La page principale de Resonate |
| Se connecter (email + mdp) | Connexion classique |
| S'inscrire (2 étapes) | Création de compte |
| Se connecter via Google/GitHub | OAuth2 - alternative à la connexion classique |
| Mot de passe oublié | Demande d'email de réinitialisation |
| Réinitialiser le mot de passe | Nouveau mot de passe via lien email |
| Changer la langue FR/EN | Switch drapeau en haut à droite |

---

### 🟢 Section User (au milieu - vert)

Ce sont les actions accessibles **uniquement si connecté** :

| Action | Description |
|---|---|
| Voir son profil | Accès à ses informations personnelles |
| Modifier son avatar (URL) | Changer sa photo de profil |
| Modifier sa bio et son site web | Éditer sa présentation |
| Changer le thème Dark/Light | Persisté en BDD |
| Télécharger ses données (RGPD) | Export JSON - droit légal en Europe |
| Se déconnecter | Supprime le JWT du navigateur |
| Changer son mot de passe | Via la page reset password |
| Accéder aux paramètres | Page /settings |

---

### 🟠 Section Admin (en bas - orange)

Ce sont les actions accessibles **uniquement si role = "admin" en BDD** :

| Action | Description |
|---|---|
| Accéder au panel Admin | Route /auth/admin-test |
| Voir tous les utilisateurs | Via pgAdmin ou future route admin |
| Promouvoir un User en Admin | UPDATE SQL en BDD |
| Bannir / Activer un compte | Modifier is_active en BDD |
| Exporter les données utilisateurs | Export des données |
| Vérifier l'état du serveur | Route /health |

---

## Résumé visuel des droits

```
                    VISITEUR        USER          ADMIN
                    ────────        ────          ─────
Voir l'accueil        ✅             ✅             ✅
Se connecter          ✅             ✅             ✅
S'inscrire            ✅             ✅             ✅
OAuth Google/GitHub   ✅             ✅             ✅
Mot de passe oublié   ✅             ✅             ✅
Changer langue        ✅             ✅             ✅
─────────────────────────────────────────────────────
Voir profil           ❌             ✅             ✅
Modifier avatar       ❌             ✅             ✅
Modifier bio          ❌             ✅             ✅
Changer thème         ❌             ✅             ✅
Export RGPD           ❌             ✅             ✅
Se déconnecter        ❌             ✅             ✅
Page /settings        ❌             ✅             ✅
─────────────────────────────────────────────────────
Panel Admin           ❌             ❌             ✅
Gérer les users       ❌             ❌             ✅
Promouvoir Admin      ❌             ❌             ✅
Bannir un compte      ❌             ❌             ✅
```
