from typing import Any, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
import datetime as dt


class DatasetOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    row_count: int
    column_schema: Optional[list] = None
    created_at: dt.datetime

    class Config:
        from_attributes = True


class IngestionJobOut(BaseModel):
    id: int
    dataset_id: Optional[int] = None
    filename: str
    status: str
    progress: int
    message: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime

    class Config:
        from_attributes = True


class ColumnSummary(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_pct: float
    unique_count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[Any] = None
    max: Optional[Any] = None
    median: Optional[float] = None
    top_values: Optional[list] = None


class DatasetSummary(BaseModel):
    dataset_id: int
    name: str
    row_count: int
    column_count: int
    columns: list[ColumnSummary]


class GraphNode(BaseModel):
    id: str
    label: str
    group: str


class GraphEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Le mot de passe est trop long (72 octets max)")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    created_at: dt.datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"