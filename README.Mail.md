# Mise en place du serveur mail Gmail SMTP

## Pourquoi un serveur mail ?

Quand un utilisateur clique sur **"Mot de passe oublié ?"**, le backend FastAPI doit envoyer un email contenant un lien sécurisé de réinitialisation.

Pour envoyer cet email, on utilise le protocole **SMTP** (Simple Mail Transfer Protocol) via Gmail, gratuit, simple à configurer, parfait pour un projet étudiant.

---

## Architecture du flux email

```
Utilisateur clique "Mot de passe oublié"
         ↓
Frontend → POST /api/v1/auth/forgot-password
         ↓
Backend vérifie si l'email existe en BDD
         ↓
Backend génère un token JWT (expire dans 1h)
         ↓
Backend envoie l'email via Gmail SMTP ← ICI
         ↓
Utilisateur reçoit l'email avec un lien cliquable
         ↓
Utilisateur clique → page /reset-password?token=xxx
         ↓
Nouveau mot de passe enregistré en BDD
```

---

## Prérequis

- Un compte **Gmail** (compte Google personnel ou SUPINFO)
- La **validation en deux étapes** activée sur le compte Google

---

## Étape 1 - Activer la validation en deux étapes

1. Va sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **"Sécurité et connexion"**
3. Cliquez sur **"Validation en deux étapes"**
4. Suivez les étapes pour l'activer (vérification par SMS)

> **Obligatoire** — Sans cette étape, on ne peut pas créer un mot de passe d'application.

---

## Étape 2 - Créer un mot de passe d'application

> Un mot de passe d'application est un code de 16 caractères généré par Google, **différent de notre vrai mot de passe**. Il permet à Resonate d'envoyer des emails sans exposer notre vrai mot de passe.

1. Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Connectez-vous si demandé
3. Dans le champ **"Nom de l'application"** → tapez `Resonate`
4. Cliquez **"Créer"**
5. Google génère un code de 16 caractères → **copiez-le immédiatement**

```
Exemple : abcd efgh ijkl mnop
```

> Ce code n'est affiché **qu'une seule fois**. Gardez-le précieusement.

---

## Étape 3 - Configurer le `.env` du backend

Ouvrez le fichier `backend/.env` et ajoutez ces lignes :

```env
# Email — Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ton.email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=ton.email@gmail.com
```

**Remplacez :**
- `ton.email@gmail.com` → votre adresse Gmail
- `abcdefghijklmnop` → le mot de passe d'application généré à l'étape 2 (sans les espaces)

---

## Étape 4 - Dépendance Python

La librairie `aiosmtplib` est utilisée pour envoyer les emails de manière **asynchrone** (sans bloquer le serveur).

Vérifiez qu'elle est bien dans `backend/requirements.txt` :

```
aiosmtplib==3.0.1
```

---

## Fichiers concernés

### `backend/app/services/email.py`
Service d'envoi d'email - génère le HTML de l'email et l'envoie via SMTP.

### `backend/app/api/v1/auth.py`
Contient les deux routes :
- `POST /api/v1/auth/forgot-password` → vérifie l'email + envoie l'email
- `POST /api/v1/auth/reset-password` → vérifie le token + met à jour le mot de passe

### `backend/app/core/config.py`
Contient les variables de configuration mail :

```python
MAIL_HOST: str = "smtp.gmail.com"
MAIL_PORT: int = 587
MAIL_USERNAME: str = ""
MAIL_PASSWORD: str = ""
MAIL_FROM: str = ""
```

---

## Tester l'envoi d'email

1. Lancez Docker : `docker compose up`
2. Allez sur `http://localhost:5173/login`
3. Cliquez sur **"Mot de passe oublié ?"**
4. Entrez une adresse email **réelle** (qui existe en BDD)
5. Cliquez **"Envoyer le lien"**
6. Vérifiez votre boîte Gmail

> L'email doit correspondre à un utilisateur existant en BDD. Pour créer un utilisateur de test avec un vrai email, utilisez Swagger sur `http://localhost:8000/docs`.

---

## Sécurité

| Mesure | Explication |
|---|---|
| Token JWT 1h | Le lien de réinitialisation expire automatiquement après 1 heure |
| Réponse 200 toujours | Même si l'email n'existe pas, on renvoie 200 - évite de confirmer l'existence d'un compte |
| Hash bcrypt | Le nouveau mot de passe est hashé avec bcrypt avant d'être stocké en BDD |
| Type "reset" | Le token contient un champ `type: reset` pour éviter qu'un JWT de connexion soit utilisé pour reset |

---

## Problèmes fréquents

### L'email n'arrive pas
- Vérifiez que `MAIL_USERNAME` et `MAIL_PASSWORD` sont corrects dans `.env`
- Vérifiez que la validation en deux étapes est bien activée
- Vérifiez les logs du backend : `docker compose logs backend --tail=20`

### Erreur "Authentication failed"
- Le mot de passe d'application est mal copié → régénèrez-en un nouveau sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### L'email arrive dans les spams
- Normal pour les tests - ajoutez l'adresse expéditrice à vos contacts Gmail

