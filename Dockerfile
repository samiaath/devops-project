# 1. On part d'une base officielle Node.js (version 18, légère "alpine")
FROM node:18-alpine

# 2. On définit le dossier de travail à l'intérieur du conteneur
WORKDIR /app

# 3. On copie les fichiers de dépendances (package.json)
COPY package*.json ./

# 4. On installe les dépendances dans le conteneur
RUN npm install

# 5. On copie tout le reste du code
COPY . .

# 6. On dit au conteneur qu'il doit écouter sur le port 3000
EXPOSE 3000

# 7. La commande pour démarrer l'app quand le conteneur se lance
CMD ["node", "app.js"]