import datetime as dt
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Enum, Boolean
)
from sqlalchemy.orm import relationship
import enum
from .database import Base


class IngestionStatus(str, enum.Enum):
    PENDING = "pending"
    PARSING = "parsing"
    VALIDATING = "validating"
    STORING = "storing"
    COMPLETED = "completed"
    FAILED = "failed"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    row_count = Column(Integer, default=0)
    column_schema = Column(JSON, nullable=True)  # [{name, dtype}, ...]
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    rows = relationship("DatasetRow", back_populates="dataset", cascade="all, delete-orphan")
    jobs = relationship("IngestionJob", back_populates="dataset", cascade="all, delete-orphan")


class DatasetRow(Base):
    __tablename__ = "dataset_rows"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)

    dataset = relationship("Dataset", back_populates="rows")


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    status = Column(Enum(IngestionStatus), default=IngestionStatus.PENDING)
    progress = Column(Integer, default=0)  # 0-100
    message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    dataset = relationship("Dataset", back_populates="jobs")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

    hashed_password = Column(String(255), nullable=True)

    google_id = Column(
        String(255),
        unique=True,
        nullable=True,
        index=True
    )

    oauth_provider = Column(
        String(50),
        nullable=True
    )

    email_verified = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        default=dt.datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=dt.datetime.utcnow,
        onupdate=dt.datetime.utcnow
    )

    verification_tokens = relationship(
        "VerificationToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    purpose = Column(String(50), nullable=False, default="email_verification")
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="verification_tokens")