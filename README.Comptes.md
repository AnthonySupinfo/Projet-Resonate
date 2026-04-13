# Créer un compte User et Admin

> **Swagger UI :** http://localhost:8000/docs
> **pgAdmin :** http://localhost:5050

---

## Créer un compte User simple

Un compte user se crée directement depuis le frontend ou via Swagger.

---

### Option 1 - Via le frontend (recommandé)

1. Ouvrez `http://localhost:5173/register`
2. Remplisez le formulaire :
   - Identifiant (username)
   - Email
   - Mot de passe (8 chars min + 1 chiffre)
   - Confirmation mot de passe
3. Cliquez **"Suivant"**
4. Remplire les infos personnelles (optionnel)
5. Cliquez **"Valider"**
6. Vous êtes automatiquement connecté et redirigé vers l'accueil

---

### Option 2 - Via Swagger

1. Ouvrez `http://localhost:8000/docs`
2. Allez sur **POST** `/api/v1/auth/register`
3. Cliquez **"Try it out"**
4. Entrez ce corps de requête :
```json
{
  "email": "user@gmail.com",
  "username": "monusername",
  "password": "motdepasse12"
}
```
5. Cliquez **"Execute"**
6. Réponse attendue (201) :
```json
{
  "id": "uuid-généré",
  "email": "user@gmail.com",
  "username": "monusername",
  "role": "user"
}
```

---

### Se connecter en tant que User

1. Ouvrez `http://localhost:5173/login`
2. Entrez votre email + mot de passe
3. Cliquez **"Se connecter"**
4. Vous arrivez sur la page d'accueil

**Ou via Swagger :**
1. Allez sur **POST** `/api/v1/auth/login`
2. Entrez :
```json
{
  "email": "user@gmail.com",
  "password": "motdepasse12"
}
```
3. Copiez le `access_token` reçu
4. Cliquez **"Authorize"** en haut → colle le token → **"Authorize"**

---

### Vérifier que le compte est bien User

Via Swagger → **GET** `/api/v1/auth/me` → vous devez voir :
```json
{
  "user_id": "uuid",
  "role": "user"
}
```

---

## Créer un compte Admin

Il n'existe pas de formulaire d'inscription admin - c'est **volontaire pour la sécurité**. On crée d'abord un compte user normal, puis on le promeut admin directement en BDD via pgAdmin.

---

### Étape 1 - Créer le compte normalement

Via Swagger → **POST** `/api/v1/auth/register` :
```json
{
  "email": "admin@resonate.com",
  "username": "resonate_admin",
  "password": "adminpass12"
}
```

Réponse attendue :
```json
{
  "id": "uuid-généré",
  "email": "admin@resonate.com",
  "username": "resonate_admin",
  "role": "user"   ← encore user pour l'instant
}
```

---

### Étape 2 - Ouvrir pgAdmin

1. Ouvrez `http://localhost:5050`
2. Connectez-vous :
   - Email : `admin@resonate.com`
   - Mot de passe : `admin123`
3. Dans le panneau gauche :
   ```
   Servers → Resonate → Bases de données → resonate → Schémas → public → Tables
   ```
4. Cliquez sur **"Outils"** → **"Éditeur de requête"**

---

### Étape 3 - Promouvoir en Admin via SQL

Dans l'éditeur de requête, tapez :

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@resonate.com';
```

Cliquez **▶ Exécuter** (ou `F5`)

Réponse attendue :
```
UPDATE 1
```

> Si vous voyez`UPDATE 0` → l'email n'existe pas en BDD, vérifiez l'orthographe.

---

### Étape 4 — Vérifier en BDD

Toujours dans l'éditeur de requête :

```sql
SELECT id, email, username, role FROM users WHERE email = 'admin@resonate.com';
```

Vous devez voir :
```
email                  | username        | role
admin@resonate.com     | resonate_admin  | admin 
```

---

### Étape 5 — Se connecter en Admin

Via Swagger → **POST** `/api/v1/auth/login` :
```json
{
  "email": "admin@resonate.com",
  "password": "adminpass12"
}
```

Copiez le `access_token` reçu.

> Le token contient maintenant `role: "admin"` dedans.

---

### Étape 6 — Vérifier l'accès Admin

1. Dans Swagger → cliquez **"Authorize"** → collez le token → **"Authorize"**
2. Allez sur **GET** `/api/v1/auth/admin-test`
3. Cliquez **"Try it out"** → **"Execute"**

Réponse attendue (200) ✅ :
```json
{
  "message": "Accès admin confirmé",
  "user_id": "uuid-admin"
}
```

Si vous recevez `403 Forbidden` → le token n'a pas été mis à jour. Déconnectez-vous et reconnectez-vous pour obtenir un nouveau JWT avec le bon rôle.

---

## Résumé des différences

| | User | Admin |
|---|---|---|
| Inscription | Via /register ou frontend | Via /register puis UPDATE SQL |
| Connexion | Email + mdp | Email + mdp (identique) |
| JWT role | `"user"` | `"admin"` |
| GET /auth/me | ✅ | ✅ |
| GET /users/me | ✅ | ✅ |
| GET /auth/admin-test | ❌ 403 Forbidden | ✅ 200 OK |

---

## Points importants

**Le JWT doit être renouvelé après la promotion admin.**
Si vous changez le role en BDD pendant qu'un utilisateur est connecté, son ancien token JWT contient encore `role: "user"`. Il doit se déconnecter et se reconnecter pour obtenir un nouveau token avec `role: "admin"`.

**Ne jamais exposer un formulaire d'inscription admin en production.**
La promotion se fait uniquement via BDD - c'est une décision d'architecture intentionnelle pour la sécurité.

**Voir les comptes existants :**
```sql
SELECT id, email, username, role, created_at FROM users ORDER BY created_at DESC;
```

**Rétrograder un admin en user :**
```sql
UPDATE users SET role = 'user' WHERE email = 'admin@resonate.com';
```
