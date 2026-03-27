# Utilise une image Python légère
FROM python:3.12-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# On copie d'abord le fichier de dépendances pour profiter du cache Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensuite, on copie le reste du code de l'application
COPY . .

# Exposer le port sur lequel FastAPI va tourner
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]