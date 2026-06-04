#!/usr/bin/env bash
# Genere les certificats HTTPS locaux pour Resonate
set -e

echo "Generation des certificats HTTPS..."

# 1. Verifie que mkcert est bien installe
if ! command -v mkcert > /dev/null 2>&1; then
  echo "ERREUR : mkcert n'est pas installe."
  echo "Installe-le d'abord : https://github.com/FiloSottile/mkcert#installation"
  exit 1
fi

# 2. Installe l'autorite de certification locale (rend les certs fiables -> pas d'avertissement)
mkcert -install

# 3. Cree le dossier des certificats s'il n'existe pas
mkdir -p nginx/certs

# 4. Genere le certificat + la cle pour localhost
cd nginx/certs
mkcert localhost 127.0.0.1

echo "Termine ! Certificats crees dans nginx/certs/"
echo "Vous pouvez maintenant lancer : docker compose up --build"