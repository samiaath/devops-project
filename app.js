const express = require('express');
const client = require('prom-client'); 
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Middleware pour lire le JSON dans les requêtes POST
app.use(express.json());

// --- 0. MINI BASE DE DONNÉES (En mémoire) ---
const tasks = [
  { id: '1', title: 'Finir le projet DevOps', done: false }
];

// --- 1. CONFIGURATION DES MÉTRIQUES (PROMETHEUS) ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// --- 2. MIDDLEWARE D'OBSERVABILITÉ ---
app.use((req, res, next) => {
  const traceId = uuidv4();
  req.traceId = traceId;

  res.on('finish', () => {
    // Incrémente le compteur Prometheus
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path, // Capture la route générique (/tasks/:id)
      status_code: res.statusCode,
    });

    // Log JSON structuré
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'error' : 'info',
      trace_id: traceId, 
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      message: res.statusCode >= 400 ? 'Erreur requête' : 'Requête traitée',
    }));
  });
  next();
});

// --- 3. ROUTES MÉTIER (API TODO LIST) ---

// Récupérer toutes les tâches
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Créer une tâche
app.post('/tasks', (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ error: 'Le titre est obligatoire' });
  }
  const newTask = {
    id: uuidv4(),
    title: req.body.title,
    done: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Supprimer une tâche
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === id);

  if (index !== -1) {
    const deleted = tasks.splice(index, 1);
    res.json({ message: 'Tâche supprimée', task: deleted[0] });
  } else {
    res.status(404).json({ error: 'Tâche non trouvée' });
  }
});

// --- 4. ROUTES TECHNIQUES ---

app.get('/', (req, res) => {
  res.send('API DevOps Ready! Routes disponibles: GET/POST /tasks, DELETE /tasks/:id');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/error', (req, res) => {
  // Simule une erreur critique pour tester les logs et alertes
  throw new Error("Simulation d'un crash inattendu !");
});

// Gestionnaire d'erreurs global (pour éviter que l'app crash sur /error)
app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'fatal',
    trace_id: req.traceId,
    message: err.message,
    stack: err.stack
  }));
  res.status(500).json({ error: 'Erreur Serveur Interne' });
});

app.listen(port, () => {
  console.log(`Application démarrée sur http://localhost:${port}`);
});