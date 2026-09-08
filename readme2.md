# Plateforme BNI — Data Warehouse

Plateforme web permettant d'ingerer, stocker, explorer et visualiser des
donnees avec authentification. Stack : **React 18 (Vite) + FastAPI + MySQL**.

## Fonctionnalites implementees

### Authentification

- Page d'accueil publique et inscription/connexion par email et mot de passe.
- Authentification par JWT et consultation de l'utilisateur connecte.
- Connexion Google OAuth2/OpenID Connect, activee uniquement lorsque les
  identifiants Google sont configures.
- Verification d'adresse email par lien a duree limite et utilisable une seule
  fois. Si SMTP n'est pas configure, le lien est affiche dans les logs du
  serveur.

### Entrepot de donnees

- Upload de fichiers CSV depuis la page **Datasets**.
- Pipeline d'ingestion en tache de fond avec les etapes parsing, validation,
  stockage, succes et echec, ainsi que le suivi des jobs en cours et termines.
- Stockage des lignes ingerees au format JSON dans une table generique.
- Liste des datasets, recherche, filtres par type/proprietaire/categorie/statut
  et suppression d'un dataset.
- Consultation paginee des donnees tabulaires.
- Jeu de donnees de demonstration (clients, produits et commandes lies) via
  `python -m app.seed`.

### Exploration et visualisation

- **Dashboard** : nombre de datasets, nombre de lignes ingerees, datasets et
  jobs d'ingestion recents.
- **Explorer un dataset** : apercu des premieres lignes, metadonnees, tags,
  proprietaire et categorie.
- **Exploration** : profil automatique par colonne avec type, valeurs
  manquantes, valeurs uniques, statistiques numeriques et valeurs
  categorielles les plus frequentes.
- **Visualizations** : graphe D3 force-directed construit a partir des
  colonnes se terminant par `_id`, avec noeuds, relations, groupes colores et
  deplacement des noeuds.

### Import Databricks

Des utilitaires backend permettent de lister et d'importer des tables depuis
Databricks. Ils sont disponibles sous forme de scripts et necessitent les
variables de configuration Databricks ; aucun parcours frontend ni endpoint
API ne les expose actuellement.

Toutes les routes de donnees et d'ingestion necessitent un JWT. L'API expose
egalement `GET /api/health` pour verifier son etat.

## Demarrer en local (sans Docker)

### 1. Base de donnees MySQL

Installez MySQL directement sur votre machine si ce n'est pas deja fait :

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
Installez MySQL Community Server depuis https://dev.mysql.com/downloads/installer/
et demarrez le service MySQL80 depuis les Services Windows.

Puis creez la base et l'utilisateur de l'application. Notez que MySQL
distingue les connexions par socket local (`localhost`) et par TCP
(`127.0.0.1`) - creez l'utilisateur pour les deux afin d'eviter tout probleme
de connexion depuis Python :

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

Si vous avez deja une instance MySQL (locale, distante, ou geree par votre
etablissement), utilisez-la directement en adaptant `.env` a l'etape suivante.

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows : venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Ouvrez .env et renseignez au minimum DB_PASSWORD avec le mot de passe
# choisi ci-dessus. SECRET_KEY et SESSION_SECRET_KEY ont des valeurs de dev
# par defaut, a changer avant tout deploiement reel. MAIL_* et GOOGLE_*
# sont optionnels - l'app fonctionne sans (voir plus haut).

python -m app.seed          # cree les donnees fictives (clients/produits/commandes)
uvicorn app.main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`. Documentation interactive :
`http://localhost:8000/docs`. Le schema est cree au demarrage ; les migrations
Alembic sont disponibles dans `backend/alembic/` pour les evolutions du schema.
Creez un compte depuis la page de connexion pour acceder au tableau de bord.

### Configuration optionnelle

- `MAIL_*` active l'envoi reel des emails de verification.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI` activent
  Google OAuth.
- `DATABRICKS_SERVER_HOSTNAME`, `DATABRICKS_HTTP_PATH` et `DATABRICKS_TOKEN`
  configurent les utilitaires d'import Databricks.
- `FRONTEND_URL` et `BACKEND_URL` configurent les URLs utilisees par les
  services web.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

L'interface est disponible sur `http://localhost:5173` (le proxy Vite
redirige `/api` vers `http://localhost:8000`). Creez un compte depuis la
page de connexion pour acceder au tableau de bord.

## Structure

```
backend/
  app/
    main.py                         point d'entree FastAPI et route de sante
    database.py                     connexion SQLAlchemy / MySQL
    config.py                       configuration email, OAuth et Databricks
    auth.py                         JWT, hachage et tokens de verification
    models.py                       User, VerificationToken, Dataset, DatasetRow,
                                    IngestionJob
    schemas.py                      schemas Pydantic
    seed.py                         generation des donnees fictives
    services/
      email_service.py              email de verification (no-op si SMTP absent)
      databricks_client.py          acces aux tables Databricks
      databricks_import.py          import Databricks vers la plateforme
    routers/
      auth.py                        inscription, connexion, OAuth, verification
      ingestion.py                   upload et suivi du pipeline
      datasets.py                    datasets, donnees et suppression
      summary.py                     profiling automatique
      graph.py                       graphe de relations
  alembic/                            migrations du schema
frontend/
  src/
    pages/                            pages publiques, authentification et application
      Landing/                        page publique
      Auth/                           connexion, OAuth et verification email
      Dashboard.jsx                  vue d'ensemble
      Datasets.jsx                   upload, filtres et suivi des jobs
      ExplorerDataset.jsx            apercu et metadonnees d'un dataset
      Exploration.jsx                profiling par colonne
      Visualizations.jsx              graphe D3 interactif
    layout/                           shell du tableau de bord (sidebar, header)
```

## Notes de conception

- Le stockage des lignes ingerees utilise une table generique
  (`dataset_rows` avec une colonne `JSON`) plutot que de creer une table SQL
  par dataset : plus simple pour un MVP tout en restant sur MySQL.
- Le graphe de relations est deduit automatiquement des colonnes se
  terminant par `_id` (ex: `customer_id` -> dataset `customers`). Une vraie
  integration Neo4j pourrait remplacer ce module en poussant les memes
  noeuds/aretes via le driver `neo4j` et Cypher, sans changer le frontend.
- L'ingestion est simulee en arriere-plan (FastAPI `BackgroundTasks`) avec
  des etapes explicites (analyse, validation, stockage) pour illustrer le
  suivi de progression demande dans le cahier des charges.
- L'email de verification et la connexion Google sont optionnels : sans
  configuration SMTP/Google, l'application demarre et fonctionne
  normalement.

## Next Steps / Remaining Tasks

- Implementer les pages **Analyses**, **ML & Scoring**, **Fraud Detection** et
  **Administration**, actuellement des placeholders.
- Implementer les onglets supplementaires de l'explorateur dataset : Donnees,
  Relations, Statistiques, Qualite, Versions, Provenance et Acces.
- Connecter les actions Télécharger, Partager et Demander l'acces de
  l'explorateur a des fonctionnalites backend.
- Ajouter le parcours de reinitialisation du mot de passe.
- Implementer le bouton d'authentification Microsoft.
- Faire respecter le choix « Rester connecte pendant 30 jours » dans la duree
  de vie et la persistance du token.
- Connecter l'import Databricks a un endpoint API et a un parcours frontend.
- Ajouter une suite de tests du projet.

Commande pour lancer le projet
cd frontend
npm run dev

Autre fenetre
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

