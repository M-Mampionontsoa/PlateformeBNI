# Plateforme BNI — Data Warehouse

Plateforme web permettant d'ingérer, stocker, explorer et visualiser des
données, avec authentification. Stack : **React 18 (Vite) + FastAPI + MySQL**.

## Fonctionnalités

### Authentification

- Page d'accueil publique et inscription/connexion par email et mot de passe
  (mots de passe hachés avec argon2 via passlib).
- Authentification par JWT et consultation de l'utilisateur connecté.
- Connexion Google OAuth2/OpenID Connect, activée uniquement lorsque les
  identifiants Google sont configurés.
- Vérification d'adresse email par lien à durée limitée et utilisable une
  seule fois. Si SMTP n'est pas configuré, le lien est affiché dans les logs
  du serveur au lieu d'être envoyé.

### Entrepôt de données

- Upload de fichiers CSV depuis la page **Datasets**.
- Pipeline d'ingestion en tâche de fond (`BackgroundTasks`) avec les étapes
  parsing, validation, stockage, succès et échec, et suivi des jobs en
  cours et terminés.
- Stockage des lignes ingérées au format JSON dans une table générique
  (`dataset_rows`).
- Liste des datasets, recherche, filtres par type/propriétaire/catégorie/statut
  et suppression d'un dataset.
- Consultation paginée des données tabulaires.
- Jeu de données de démonstration (clients, produits, commandes liés) via
  `python -m app.seed`.

### Exploration et visualisation

- **Dashboard** : nombre de datasets, nombre de lignes ingérées, datasets et
  jobs d'ingestion récents.
- **Explorer un dataset** : aperçu des premières lignes, métadonnées, tags,
  propriétaire et catégorie.
- **Exploration** : profil automatique par colonne (type, valeurs manquantes,
  valeurs uniques, statistiques numériques, valeurs catégorielles les plus
  fréquentes).
- **Visualizations** : graphe D3 force-directed construit à partir des
  colonnes se terminant par `_id`, avec nœuds, relations, groupes colorés et
  déplacement des nœuds.

### Import Databricks

Des utilitaires backend permettent de lister et d'importer des tables depuis
Databricks. Ils sont disponibles sous forme de scripts et nécessitent les
variables de configuration Databricks ; aucun parcours frontend ni endpoint
API ne les expose actuellement.

Toutes les routes de données et d'ingestion nécessitent un JWT. L'API expose
également `GET /api/health` pour vérifier son état, et sa documentation
interactive sur `/docs`.

**Hors périmètre pour l'instant** : les sections Analyses, ML & Scoring,
Fraud Detection et Administration du tableau de bord sont des emplacements
réservés ("Contenu à venir").

## Prérequis

- Python 3.12
- Node.js (18+) et npm
- MySQL 8, ou Docker + Docker Compose
- `python3-venv` (sur Ubuntu/Debian : `sudo apt install python3-venv python3-full`)

## Démarrer avec Docker Compose (recommandé)

C'est la méthode la plus simple : backend, frontend et MySQL tournent
ensemble dans le même réseau Docker, où les conteneurs se résolvent entre eux
par leur nom de service (ex: `mysql`, `backend`).

```bash
docker compose up --build
```

- Frontend : `http://localhost:5173` (ou le port défini dans `docker-compose.yml`)
- Backend / API : `http://localhost:8000`
- Documentation interactive : `http://localhost:8000/docs`

Si tu modifies `backend/requirements.txt` ou `frontend/package.json`,
reconstruis l'image concernée avant de relancer :

```bash
docker compose build backend
docker compose up
```

**Point important** : `DATABASE_URL` (ou les variables `DB_*`) doit pointer
vers l'hôte `mysql` (le nom du service Docker) pour que le backend en
conteneur trouve la base — voir la section [Dépannage](#dépannage) si tu
passes de Docker au mode local ou inversement, car l'hôte à utiliser change.

## Démarrer en local (sans Docker)

### 1. Base de données MySQL

Installe MySQL directement sur ta machine si ce n'est pas déjà fait :

**Ubuntu/Debian**
```bash
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
```

**macOS (Homebrew)**
```bash
brew install mysql
brew services start mysql
```

**Windows**
Installe MySQL Community Server depuis
https://dev.mysql.com/downloads/installer/ et démarre le service MySQL80
depuis les Services Windows.

Puis crée la base et l'utilisateur de l'application. MySQL distingue les
connexions par socket local (`localhost`) et par TCP (`127.0.0.1`) — crée
l'utilisateur pour les deux afin d'éviter tout problème de connexion depuis
Python :

```bash
sudo mysql -u root
```
```sql
CREATE DATABASE dw_mvp;
CREATE USER 'dw_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
CREATE USER 'dw_user'@'127.0.0.1' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON dw_mvp.* TO 'dw_user'@'localhost';
GRANT ALL PRIVILEGES ON dw_mvp.* TO 'dw_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Si tu as déjà une instance MySQL (locale, distante, ou gérée par ton
établissement), utilise-la directement en adaptant `.env` à l'étape suivante.

Alternative : tu peux aussi ne lancer que le conteneur MySQL de
`docker-compose.yml` et garder le reste en local :

```bash
docker compose up mysql
```

### 2. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

Si `requirements.txt` est vide ou incomplet, installe manuellement les
dépendances connues du projet puis régénère le fichier :

```bash
pip install fastapi "uvicorn[standard]" sqlalchemy "pydantic[email]" \
  python-dotenv python-jose "passlib[bcrypt]" argon2_cffi authlib httpx \
  pandas databricks-sql-connector itsdangerous pymysql
pip freeze > requirements.txt
```

Puis configure l'environnement :

```bash
cp .env.example .env
```

Ouvre `.env` et renseigne au minimum `DB_PASSWORD` avec le mot de passe
choisi ci-dessus. En local (hors Docker), l'hôte de la base doit être
`localhost` ou `127.0.0.1`, **pas** `mysql`. `SECRET_KEY` et
`SESSION_SECRET_KEY` ont des valeurs de dev par défaut, à changer avant tout
déploiement réel. `MAIL_*` et `GOOGLE_*` sont optionnels — l'app fonctionne
sans (voir la section Fonctionnalités).

```bash
python -m app.seed          # crée les données fictives (clients/produits/commandes)
uvicorn app.main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`. Documentation interactive :
`http://localhost:8000/docs`. Le schéma est créé au démarrage ; les
migrations Alembic sont disponibles dans `backend/alembic/` pour les
évolutions du schéma.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

L'interface est disponible sur `http://localhost:5173` (le proxy Vite
redirige `/api` vers `http://localhost:8000`). Crée un compte depuis la page
de connexion pour accéder au tableau de bord.

### Lancer le projet au quotidien

Une fois l'installation initiale faite, deux terminaux suffisent :

```bash
# Terminal 1
cd frontend
npm run dev

# Terminal 2
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Variables d'environnement

Définies dans `backend/.env` (voir `.env.example` pour la liste exacte et
les valeurs par défaut) :

- `DB_*` / `DATABASE_URL` — connexion MySQL. L'hôte diffère entre Docker
  (`mysql`) et local (`localhost`).
- `SECRET_KEY`, `SESSION_SECRET_KEY` — clés de session/JWT, à changer avant
  tout déploiement réel.
- `MAIL_*` — active l'envoi réel des emails de vérification (optionnel).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` —
  activent la connexion Google OAuth (optionnel).
- `DATABRICKS_SERVER_HOSTNAME`, `DATABRICKS_HTTP_PATH`, `DATABRICKS_TOKEN` —
  configurent les utilitaires d'import Databricks (optionnel).
- `FRONTEND_URL`, `BACKEND_URL` — URLs utilisées par les services web
  (redirections OAuth, liens dans les emails, etc.).

## Structure du projet

```
backend/
  app/
    main.py                         point d'entrée FastAPI et route de santé
    database.py                     connexion SQLAlchemy / MySQL
    config.py                       configuration email, OAuth et Databricks
    auth.py                         JWT, hachage (argon2) et tokens de vérification
    models.py                       User, VerificationToken, Dataset, DatasetRow,
                                     IngestionJob
    schemas.py                      schémas Pydantic
    seed.py                         génération des données fictives
    services/
      email_service.py              email de vérification (no-op si SMTP absent)
      databricks_client.py          accès aux tables Databricks
      databricks_import.py          import Databricks vers la plateforme
    routers/
      auth.py                       inscription, connexion, OAuth, vérification
      ingestion.py                  upload et suivi du pipeline
      datasets.py                   datasets, données et suppression
      summary.py                    profiling automatique
      graph.py                      graphe de relations
  alembic/                          migrations du schéma
  requirements.txt                  dépendances Python
  Dockerfile
frontend/
  src/
    pages/
      Landing/                      page publique
      Auth/                         connexion, OAuth et vérification email
      Dashboard.jsx                 vue d'ensemble
      Datasets.jsx                  upload, filtres et suivi des jobs
      ExplorerDataset.jsx           aperçu et métadonnées d'un dataset
      Exploration.jsx               profiling par colonne
      Visualizations.jsx            graphe D3 interactif
    layout/                         shell du tableau de bord (sidebar, header)
docker-compose.yml
```

## Dépannage

Problèmes rencontrés pendant le développement et leur solution :

**`ModuleNotFoundError` malgré un venv activé et `pip install` réussi**
Le traceback pointe vers `/usr/lib/python3/dist-packages/...` au lieu de
`venv/lib/.../site-packages/...` : le sous-processus `uvicorn --reload`
n'utilise pas l'interpréteur du venv (souvent un process fantôme d'une
session précédente, ou un shell où l'activation a été perdue). Vérifie avec
`which python` et `which uvicorn` — les deux doivent pointer vers
`backend/venv/bin/`. En cas de doute, force l'appel avec
`venv/bin/python -m uvicorn app.main:app --reload --port 8000`, ou ferme et
rouvre le terminal puis réactive le venv.

**`requirements.txt` vide**
Rien n'est alors installé par `pip install -r requirements.txt`. Réinstalle
les dépendances manuellement (voir la commande dans la section Backend
ci-dessus) puis régénère le fichier avec `pip freeze > requirements.txt`.

**`Can't connect to MySQL server on 'mysql'`**
Le nom d'hôte `mysql` n'est résolvable que dans le réseau interne Docker.
Si tu lances `uvicorn` en local (hors conteneur), remplace l'hôte dans
`.env` par `localhost` ou `127.0.0.1`. Garde `mysql` uniquement quand le
backend tourne lui-même dans Docker Compose.

**`failed to fetch` côté frontend, alors que le backend ne reçoit aucune requête**
Le frontend tourne dans un conteneur Docker, mais le navigateur (qui exécute
le JS) tourne sur ta machine, en dehors du réseau Docker : il ne connaît pas
le nom de service `backend`. L'URL de l'API appelée depuis le navigateur doit
être `http://localhost:8000`, pas `http://backend:8000`.

**`argon2: no backends available` lors de l'inscription**
Le paquet `argon2_cffi`, requis par passlib pour le hachage argon2, n'est pas
installé : `pip install argon2_cffi`.

**Image Docker : `"uvicorn": executable file not found in $PATH`**
L'image du conteneur backend a été construite à un moment où
`requirements.txt` était vide ou incomplet. Régénère `requirements.txt` en
local, puis reconstruis l'image : `docker compose build backend`.

## Notes de conception

- Le stockage des lignes ingérées utilise une table générique
  (`dataset_rows` avec une colonne `JSON`) plutôt que de créer une table SQL
  par dataset : plus simple pour un MVP tout en restant sur MySQL.
- Le graphe de relations est déduit automatiquement des colonnes se
  terminant par `_id` (ex: `customer_id` → dataset `customers`). Une vraie
  intégration Neo4j pourrait remplacer ce module en poussant les mêmes
  nœuds/arêtes via le driver `neo4j` et Cypher, sans changer le frontend.
- L'ingestion est simulée en arrière-plan (FastAPI `BackgroundTasks`) avec
  des étapes explicites (analyse, validation, stockage) pour illustrer le
  suivi de progression demandé dans le cahier des charges.
- L'email de vérification et la connexion Google sont optionnels : sans
  configuration SMTP/Google, l'application démarre et fonctionne
  normalement.

## Suite du projet

- Implémenter les pages **Analyses**, **ML & Scoring**, **Fraud Detection**
  et **Administration**, actuellement des placeholders.
- Implémenter les onglets supplémentaires de l'explorateur dataset :
  Données, Relations, Statistiques, Qualité, Versions, Provenance et Accès.
  
- Connecter l'import Databricks à un endpoint API et un parcours frontend.

- Ajouter une suite de tests du projet.


===== REMARQUE ===========
Pour le partage dans la page explorer, il faut le faire en https mais non http

Commande pour lancer le projet
cd frontend
npm run dev

Autre fenetre
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

