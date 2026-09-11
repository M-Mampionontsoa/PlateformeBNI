import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # =========================================================
    # Brevo (emails transactionnels via l'API REST)
    # =========================================================
    # La clé reste côté backend/Dokku uniquement : jamais dans le frontend.
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_API_URL: str = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3").rstrip("/")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "no-reply@data-share.manidina.me")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Angona")

    # Le sender doit être créé et vérifié dans Brevo avant l'envoi.
    # En dev local sans clé, l'inscription reste non-bloquante (lien loggé).
    MAIL_ENABLED: bool = bool(BREVO_API_KEY and MAIL_FROM)

    # =========================================================
    # Frontend
    # =========================================================
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # =========================================================
    # Google OAuth (optionnel - necessaire uniquement pour activer le
    # bouton "Continuer avec Google")
    # =========================================================
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/auth/google/callback",
    )

    GOOGLE_OAUTH_ENABLED: bool = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)

    # =========================================================
    # Session
    # =========================================================
    # Valeur par defaut fournie pour que l'app demarre out-of-the-box en
    # dev local. A definir explicitement en production.
    SESSION_SECRET_KEY: str = os.getenv(
        "SESSION_SECRET_KEY", "dev-session-secret-key-change-me"
    )

    #========================================================
    # Databricks
    #========================================================
    DATABRICKS_SERVER_HOSTNAME: str = os.getenv("DATABRICKS_SERVER_HOSTNAME", "")
    DATABRICKS_HTTP_PATH: str = os.getenv("DATABRICKS_HTTP_PATH", "")
    DATABRICKS_TOKEN: str = os.getenv("DATABRICKS_TOKEN", "")


settings = Settings()
