FROM node:20-alpine

# Créer le dossier de travail dans le conteneur
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier tout le reste du projet
COPY . .

# Exposer le port de l'application
EXPOSE 5002

# Lancer le serveur
CMD ["node", "server.js"]
