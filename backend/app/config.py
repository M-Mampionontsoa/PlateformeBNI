import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # =========================================================
    # Email / SMTP (optionnel - necessaire uniquement pour l'envoi
    # reel des emails de verification de compte)
    # =========================================================
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "no-reply@example.mg")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Plateforme BNI")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "")

    # Actif seulement si les identifiants SMTP sont fournis. Si ce n'est
    # pas le cas (dev local, demo), l'application demarre normalement et
    # l'envoi d'email de verification est simplement desactive.
    MAIL_ENABLED: bool = bool(MAIL_USERNAME and MAIL_PASSWORD and MAIL_SERVER)

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


settings = Settings()
