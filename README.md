DevOps Project: Node.js Observability Demo   + modification README
=========================================

Petite API Express instrumentée (métriques Prometheus, logs structurés, traçage par UUID) et prête pour Docker, Docker Compose et Kubernetes.

Contenu
-------
- API Node.js/Express exposée sur le port 3000
- Observabilité : `/metrics` (Prometheus), logs JSON, traçage par requête
- Conteneurisation : Dockerfile + docker-compose
- Kubernetes : manifests Deployment et Service NodePort

Prérequis
---------
- Node.js 18+ et npm
- Docker et Docker Compose v2
- (Optionnel) kubectl et Minikube si déploiement Kubernetes

Démarrage local (sans conteneur)
--------------------------------
```bash
npm install
npm start
# L'application écoute sur http://localhost:3000
```

Exemple de vérification :
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

Docker Compose
--------------
```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
```

Tests rapides :
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

Arrêter et nettoyer :
```bash
docker compose down
```

Build et run Docker (sans Compose)
----------------------------------
```bash
docker build -t devops-project-app .
docker run -p 3000:3000 -e NODE_ENV=production devops-project-app
```

Kubernetes (exemple Minikube)
-----------------------------
```bash
minikube start
kubectl apply -f deployment.yaml -f service.yaml
kubectl get pods
kubectl get svc devops-project-service
```

Accès via NodePort (par défaut 30001) :
```bash
minikube service devops-project-service --url
# ou : curl http://$(minikube ip):30001/
```

Points d'observabilité
----------------------
- `/health` : statut simple 200
- `/metrics` : métriques Prometheus (CPU, mémoire via collectDefaultMetrics + compteur http_requests_total)
- `/error` : simule une erreur et logue un événement niveau error
- Logs : JSON avec timestamp, niveau, trace_id, méthode, route, statut

Variables d'environnement utiles
--------------------------------
- `PORT` (optionnel) : port d'écoute, 3000 par défaut
- `NODE_ENV` : par défaut production dans docker-compose.yml

Tests
-----
```bash
npm test
```
(Actuellement un test factice qui réussit.)


API (exemples rapides)
----------------------
- GET `/` → `Hello World! Observabilité active.`
- GET `/health` → `{ "status": "OK" }`
- GET `/metrics` → exposition Prometheus (texte)
- GET `/error` → réponse 500 et log JSON niveau error

Image Docker publiée
--------------------
- Nom attendu dans la pipeline : `${DOCKER_USERNAME}/devops-mini-project:latest`
- Pousser manuellement si besoin : `docker push ${DOCKER_USERNAME}/devops-mini-project:latest`

CI/CD
-----
- GitHub Actions : tests Node, scan SAST Trivy, build & push de l'image ([.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)).
- Secrets requis : `DOCKER_USERNAME`, `DOCKER_PASSWORD`.

DAST (scan dynamique)
---------------------
Exemple avec ZAP baseline contre le service local :
```bash
docker run --rm -t zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:3000 -x zap-report.xml
```
Adapter la cible si déployé ailleurs (NodePort ou URL cloud). Ajouter ce job dans GitHub Actions pour automatiser.

Rapport final
-------------
Rédiger 1–2 pages décrivant : architecture, pipeline CI/CD, image Docker, déploiement Kubernetes, observabilité (metrics/logs/traces), sécurité (SAST/DAST), difficultés et leçons apprises.



