# Plateforme BNI — Data Warehouse

Plateforme d'entrepot de donnees permettant d'ingerer, stocker, explorer et
visualiser des donnees, avec authentification. Stack : **React (Vite) +
FastAPI + MySQL**.

## Fonctionnalites

**Entrepot de donnees**
- **Ingestion** (page *Datasets*) : upload d'un CSV, pipeline en
  arriere-plan (analyse -> validation -> stockage) avec suivi d'etat en
  direct dans l'interface.
- **Donnees tabulaires** (page *Datasets*) : consultation paginee de chaque
  dataset ingere.
- **Exploration** (page *Exploration*) : resume automatique par colonne -
  type, valeurs manquantes, valeurs uniques, statistiques descriptives
  (moyenne, mediane, ecart-type, min/max) ou top valeurs pour les colonnes
  categorielles - a la maniere de l'exploration de donnees Kaggle.
- **Visualizations** (page *Visualizations*) : detection automatique des
  colonnes `*_id` pour construire un graphe de relations (noeuds/aretes) et
  le visualiser avec un layout force-directed D3 - sert d'equivalent leger a
  une exploration Neo4j pour ce MVP.
- **Dashboard** : vue d'ensemble (nombre de datasets, lignes ingerees,
  dernieres ingestions).

Un jeu de donnees fictif (clients, produits, commandes, lies entre eux) est
fourni via un script de seed pour demontrer la plateforme sans fichiers
externes.

**Authentification**
- Inscription / connexion classique (email + mot de passe, JWT).
- Connexion avec Google (OAuth2 / OpenID Connect) - desactivee proprement si
  non configuree.
- Verification d'adresse email par lien envoye par email (ou affiche dans
  les logs si le SMTP n'est pas configure).

Toutes les routes de donnees (`/api/datasets`, `/api/ingestion`,
`/api/graph`) necessitent d'etre connecte.

**Hors perimetre pour l'instant** : les sections Analyses, ML & Scoring,
Fraud Detection et Administration du tableau de bord sont des emplacements
reserves ("Contenu a venir") pour de futures iterations - non demandees
dans le cahier des charges actuel.

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

L'API est disponible sur `http://localhost:8000`, documentation interactive
sur `http://localhost:8000/docs`.

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
    main.py              point d'entree FastAPI
    database.py            connexion SQLAlchemy / MySQL
    config.py                 configuration (mail/Google OAuth optionnels)
    auth.py                     JWT, hachage des mots de passe, tokens de verification
    models.py                     Dataset, DatasetRow, IngestionJob, User, VerificationToken
    schemas.py                      schemas Pydantic
    seed.py                           generation des donnees fictives
    services/
      email_service.py                email de verification (no-op si SMTP absent)
    routers/
      auth.py                          inscription, connexion, Google OAuth, verification email
      ingestion.py                       upload + suivi du pipeline
      datasets.py                          liste des datasets + donnees tabulaires
      summary.py                             profiling automatique
      graph.py                                 graphe de relations (noeuds/aretes)
  alembic/                                       migrations (evolutions du schema users)
frontend/
  src/
    pages/
      Landing/            page publique
      Auth/                connexion / inscription / callback Google / verification email
      Dashboard.jsx          vue d'ensemble
      Datasets.jsx              upload + suivi + table de donnees
      Exploration.jsx             profiling par colonne
      Visualizations.jsx            graphe D3 interactif
    layout/                                shell du tableau de bord (sidebar, header)
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
  normalement (le lien de verification est simplement affiche dans les logs
  serveur au lieu d'etre envoye par email).
