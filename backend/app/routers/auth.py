import httpx

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.requests import Request
from authlib.integrations.starlette_client import OAuth

from .. import models, schemas
from ..auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    create_verification_token,
    consume_verification_token,
)
from ..config import settings
from ..database import get_db
from ..services.email_service import send_verification_email


router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


# =========================================================
# GOOGLE OAUTH
# =========================================================

oauth = OAuth()

if settings.GOOGLE_OAUTH_ENABLED:
    oauth.register(
        name="google",

        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,

        # Configuration officielle OpenID Connect Google
        server_metadata_url=(
            "https://accounts.google.com/"
            ".well-known/openid-configuration"
        ),

        client_kwargs={
            "scope": "openid email profile",

            # IMPORTANT :
            # empêche HTTPX d'utiliser HTTP_PROXY / HTTPS_PROXY /
            # ALL_PROXY présents dans l'environnement système.
            "trust_env": False,

            # Évite les problèmes liés à HTTP/2 sur certains réseaux.
            "http2": False,

            # Timeout raisonnable pour Google OAuth.
            "timeout": httpx.Timeout(
                connect=30.0,
                read=30.0,
                write=30.0,
                pool=30.0,
            ),
        },
    )


# =========================================================
# INSCRIPTION CLASSIQUE
# =========================================================

@router.post(
    "/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un compte",
)
def register(
    user_in: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.User)
        .filter(models.User.email == user_in.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email",
        )

    user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        email_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Envoi de l'email de verification en arriere-plan (n'empeche jamais
    # l'inscription de reussir si le SMTP est indisponible ou non configure).
    raw_token = create_verification_token(db, user.id)
    background_tasks.add_task(
        send_verification_email, user.email, user.full_name, raw_token
    )

    return user


# =========================================================
# CONNEXION CLASSIQUE
# =========================================================

@router.post(
    "/login",
    response_model=schemas.Token,
    summary="Connexion classique",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(
            models.User.email == form_data.username
        )
        .first()
    )

    if (
        not user
        or not user.hashed_password
        or not verify_password(
            form_data.password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    access_token = create_access_token(
        data={
            "sub": user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# =========================================================
# UTILISATEUR CONNECTÉ
# =========================================================

@router.get(
    "/me",
    response_model=schemas.UserOut,
    summary="Utilisateur connecté",
)
def read_me(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


# =========================================================
# GOOGLE LOGIN
# =========================================================

@router.get(
    "/google/login",
    summary="Connexion avec Google",
)
async def google_login(
    request: Request,
):
    """
    Étape 1 :
    Redirige l'utilisateur vers Google.
    """

    if not settings.GOOGLE_OAUTH_ENABLED:
        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=google_not_configured"
            )
        )

    try:
        return await oauth.google.authorize_redirect(
            request,
            settings.GOOGLE_REDIRECT_URI,
        )

    except Exception as e:
        print(
            "GOOGLE LOGIN ERROR:",
            repr(e),
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=google_login_failed"
            )
        )


# =========================================================
# GOOGLE CALLBACK
# =========================================================

@router.get(
    "/google/callback",
    summary="Callback Google OAuth",
)
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Étape 2 :

    Google redirige ici après authentification.

    Authlib :
      - vérifie le state OAuth
      - échange le code contre un token
      - vérifie le token OpenID Connect
      - récupère userinfo
    """

    # -----------------------------------------------------
    # 1. Échanger le code Google contre le token
    # -----------------------------------------------------

    try:
        token = await oauth.google.authorize_access_token(
            request
        )

    except Exception as e:
        print(
            "GOOGLE OAUTH ERROR:",
            repr(e),
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=google_auth_failed"
            )
        )

    # -----------------------------------------------------
    # 2. Récupérer les informations utilisateur
    # -----------------------------------------------------

    user_info = token.get("userinfo")

    if not user_info:
        print(
            "GOOGLE USERINFO MISSING:",
            token,
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=google_userinfo_failed"
            )
        )

    # -----------------------------------------------------
    # 3. Lire les données Google
    # -----------------------------------------------------

    google_id = user_info.get("sub")
    email = user_info.get("email")
    full_name = user_info.get("name")
    email_verified = user_info.get(
        "email_verified",
        False,
    )

    if not google_id or not email:
        print(
            "GOOGLE INVALID USER:",
            user_info,
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=google_invalid_user"
            )
        )

    if not full_name:
        full_name = email.split("@")[0]

    # -----------------------------------------------------
    # 4. Chercher l'utilisateur par Google ID
    # -----------------------------------------------------

    user = (
        db.query(models.User)
        .filter(
            models.User.google_id == google_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 5. Si Google ID inconnu -> chercher par email
    # -----------------------------------------------------

    if not user:

        user = (
            db.query(models.User)
            .filter(
                models.User.email == email
            )
            .first()
        )

        # -------------------------------------------------
        # Compte classique déjà existant
        # -------------------------------------------------

        if user:

            user.google_id = google_id
            user.oauth_provider = "google"

            if email_verified:
                user.email_verified = True

        # -------------------------------------------------
        # Nouveau compte Google
        # -------------------------------------------------

        else:

            user = models.User(
                full_name=full_name,
                email=email,
                hashed_password=None,
                google_id=google_id,
                oauth_provider="google",
                email_verified=email_verified,
            )

            db.add(user)

    # -----------------------------------------------------
    # 6. Sauvegarder l'utilisateur
    # -----------------------------------------------------

    try:

        db.commit()
        db.refresh(user)

    except Exception as e:

        db.rollback()

        print(
            "DATABASE ERROR:",
            repr(e),
        )

        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}"
                "/login?error=database_error"
            )
        )

    # -----------------------------------------------------
    # 7. Créer notre JWT
    # -----------------------------------------------------

    access_token = create_access_token(
        data={
            "sub": user.email
        }
    )

    # -----------------------------------------------------
    # 8. Rediriger vers React
    # -----------------------------------------------------

    frontend_callback = (
        f"{settings.FRONTEND_URL}"
        f"/auth/google/callback"
        f"?token={access_token}"
    )

    return RedirectResponse(
        url=frontend_callback
    )

# =========================================================
# VERIFICATION D'EMAIL
# =========================================================

@router.get(
    "/verify-email",
    response_model=schemas.UserOut,
    summary="Confirme l'adresse email via le token recu par email",
)
def verify_email(
    token: str,
    db: Session = Depends(get_db),
):
    user = consume_verification_token(db, token, purpose="email_verification")
    user.email_verified = True
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/resend-verification",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Renvoie un email de verification a l'utilisateur connecte",
)
def resend_verification(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.email_verified:
        return {"detail": "Cette adresse est deja verifiee."}

    raw_token = create_verification_token(db, current_user.id)
    background_tasks.add_task(
        send_verification_email, current_user.email, current_user.full_name, raw_token
    )
    return {"detail": "Email de verification envoye."}
