const express = require('express');
const client = require('prom-client'); // Pour les métriques
const { v4: uuidv4 } = require('uuid'); // Pour le traçage

const app = express();
const port = 3000;

// --- 1. CONFIGURATION DES MÉTRIQUES (PROMETHEUS) ---
// On crée un registre pour stocker nos données
const register = new client.Registry();
// On ajoute les métriques par défaut (CPU, RAM, etc.)
client.collectDefaultMetrics({ register });

// On crée une métrique personnalisée : un compteur de requêtes
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// --- 2. MIDDLEWARE D'OBSERVABILITÉ (S'exécute à chaque requête) ---
app.use((req, res, next) => {
  // A. TRAÇAGE : On génère un ID unique pour cette requête
  const traceId = uuidv4();
  req.traceId = traceId;

  // B. MÉTRIQUES : On surveille la fin de la requête pour compter
  res.on('finish', () => {
    // Incrémente le compteur
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });

    // C. LOGS STRUCTURES : On affiche un log en JSON
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      trace_id: traceId, // L'ID qui permet de tracer la requête
      method: req.method,
      route: req.path,
      status: res.statusCode,
      message: 'Requête traitée',
    }));
  });

  next();
});

// --- ROUTES ---

app.get('/', (req, res) => {
  res.send('Hello World! Observabilité active.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Route spéciale pour exposer les métriques à Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Route pour simuler une erreur (pour tester les logs)
app.get('/error', (req, res) => {
  const traceId = req.traceId;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    trace_id: traceId,
    message: 'Oups, une erreur simulée !',
  }));
  res.status(500).send('Erreur interne simulée');
});

app.listen(port, () => {
  console.log(`Application démarrée sur http://localhost:${port}`);
});