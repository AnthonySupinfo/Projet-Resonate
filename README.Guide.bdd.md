# Guide SQL - Gestion des Utilisateurs & Base de données

> Base de données : **resonate** | Outil : **pgAdmin** | http://localhost:5050

---

## GESTION DES UTILISATEURS

### Voir tous les utilisateurs
```sql
SELECT * FROM users;
```

### Chercher un utilisateur précis
```sql
-- Par email
SELECT * FROM users WHERE email = 'test@exemple.com';

-- Par nom d'utilisateur
SELECT * FROM users WHERE username = 'testuser';

-- Par ID
SELECT * FROM users WHERE id = 1;
```

### Créer un utilisateur
```sql
INSERT INTO users (username, email, password, created_at)
VALUES ('testuser', 'test@exemple.com', 'motdepasse_hashé', NOW());
```

### Modifier un utilisateur
```sql
-- Changer l'email
UPDATE users SET email = 'nouveau@exemple.com' WHERE id = 1;

-- Changer le mot de passe
UPDATE users SET password = 'nouveau_hash' WHERE id = 1;

-- Modifier plusieurs champs en même temps
UPDATE users SET email = 'nouveau@exemple.com', username = 'nouveaunom' WHERE id = 1;
```

### Supprimer un utilisateur
```sql
-- Supprimer par ID (recommandé)
DELETE FROM users WHERE id = 1;

-- Supprimer par email
DELETE FROM users WHERE email = 'test@exemple.com';
```

### Compter les utilisateurs
```sql
SELECT COUNT(*) FROM users;
```

### Voir les derniers inscrits
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

---

## GESTION DE LA BASE DE DONNÉES

### Lister toutes les tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Voir les colonnes d'une table
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';
```

### Voir le nombre de lignes dans chaque table
```sql
SELECT relname AS table_name, n_live_tup AS nb_lignes
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Vider une table (garde la structure)
```sql
TRUNCATE TABLE users;
```

### Supprimer une table complètement
```sql
DROP TABLE users;
```

### Savoir dans quelle base on est
```sql
SELECT current_database();
```

### Voir toutes les bases de données disponibles
```sql
SELECT datname FROM pg_database;
```

### Voir les utilisateurs PostgreSQL (rôles)
```sql
SELECT usename, usesuper, usecreatedb FROM pg_user;
```

