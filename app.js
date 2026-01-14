// app.js
const express = require('express');
const app = express();
const port = 3000;

// Route principale (Hello World)
app.get('/', (req, res) => {
  res.send('Hello World! Mon projet DevOps fonctionne !');
});

// Route pour vérifier la santé de l'app (utile pour Kubernetes plus tard)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Application en cours d'exécution sur http://localhost:${port}`);
});