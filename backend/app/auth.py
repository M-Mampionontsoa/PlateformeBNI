import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from . import models

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = "dev-jwt-secret-key-change-me"
    print(
        "[auth] ATTENTION: SECRET_KEY n'est pas definie dans l'environnement. "
        "Une valeur de developpement est utilisee - definissez SECRET_KEY dans "
        "votre .env avant tout deploiement reel."
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))

# Vérification de token : durée de validité du lien envoyé par email
VERIFICATION_TOKEN_EXPIRE_MINUTES = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_MINUTES", 30))

# argon2 en priorité pour les nouveaux hashs, bcrypt accepté pour les comptes existants
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# ---------- Mot de passe ----------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    """Permet de re-hasher en argon2 un mot de passe encore en bcrypt, au prochain login réussi."""
    return pwd_context.needs_update(hashed_password)


# ---------- JWT (access token) ----------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ---------- Tokens de vérification email ----------
def generate_verification_token() -> str:
    """Génère un token aléatoire cryptographiquement sûr (à envoyer par email, en clair)."""
    return secrets.token_urlsafe(32)


def hash_verification_token(token: str) -> str:
    """Hash du token, à stocker en base (jamais le token brut)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_verification_token(db: Session, user_id: int, purpose: str = "email_verification") -> str:
    """
    Crée un nouveau token de vérification pour un utilisateur donné,
    l'enregistre en base (hashé), et retourne le token EN CLAIR
    (celui-ci sera envoyé par email, jamais stocké tel quel).
    """
    raw_token = generate_verification_token()
    token_hash = hash_verification_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)

    db_token = models.VerificationToken(
        user_id=user_id,
        token_hash=token_hash,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()

    return raw_token


def consume_verification_token(db: Session, raw_token: str, purpose: str = "email_verification"):
    """
    Vérifie un token reçu (en clair, depuis l'URL cliquée par l'utilisateur).
    Retourne l'utilisateur associé si le token est valide, sinon lève une HTTPException.
    Marque le token comme utilisé (usage unique).
    """
    token_hash = hash_verification_token(raw_token)

    db_token = (
        db.query(models.VerificationToken)
        .filter(
            models.VerificationToken.token_hash == token_hash,
            models.VerificationToken.purpose == purpose,
        )
        .first()
    )

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le lien de vérification est invalide.",
        )

    if db_token.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien de vérification a déjà été utilisé.",
        )

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien de vérification a expiré.",
        )

    # Marque le token comme utilisé (usage unique)
    db_token.used_at = datetime.utcnow()
    db.commit()

    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur introuvable.",
        )

    return user