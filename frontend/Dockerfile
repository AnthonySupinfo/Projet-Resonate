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

# Expose le port 5173 (port par défaut de Vite)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]