# Utiliser une image de base Node.js légère
FROM node:20-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copie le fichier package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances du projet
RUN npm install

# Ensuite, on copie le reste du code de l'application dans le conteneur
COPY . .

# Créer un utilisateur non-root et lui donner accès au dossier (sécurité)
RUN adduser --disabled-password --no-create-home appuser && chown -R appuser:appuser /app
USER appuser

# Expose le port 5173 (port par défaut de Vite)
#CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
CMD ["sh", "-c", "rm -rf node_modules/.vite && npm run dev -- --host 0.0.0.0 --port 5173"]