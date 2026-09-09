import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/datasets", tags=["summary"], dependencies=[Depends(get_current_user)])


@router.get("/{dataset_id}/summary", response_model=schemas.DatasetSummary)
def get_summary(dataset_id: int, db: Session = Depends(get_db)):
    ds = db.query(models.Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset introuvable.")

    rows = db.query(models.DatasetRow.data).filter(models.DatasetRow.dataset_id == dataset_id).all()
    records = [r[0] for r in rows]
    if not records:
        return schemas.DatasetSummary(
            dataset_id=dataset_id, name=ds.name, row_count=0, column_count=0, columns=[]
        )

    df = pd.DataFrame.from_records(records)
    n = len(df)
    columns = []

    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        numeric = pd.to_numeric(series, errors="coerce")
        is_numeric = numeric.notna().sum() >= max(1, int(0.8 * series.notna().sum()))

        col_summary = schemas.ColumnSummary(
            name=col,
            dtype="numerique" if is_numeric else "categoriel/texte",
            missing_count=missing,
            missing_pct=round(100 * missing / n, 2) if n else 0.0,
            unique_count=int(series.nunique(dropna=True)),
        )

        if is_numeric:
            desc = numeric.describe()
            col_summary.mean = round(float(desc.get("mean", 0) or 0), 3)
            col_summary.std = round(float(desc.get("std", 0) or 0), 3)
            col_summary.min = float(desc.get("min", 0) or 0)
            col_summary.max = float(desc.get("max", 0) or 0)
            col_summary.median = round(float(numeric.median()), 3)
        else:
            top = series.value_counts(dropna=True).head(5)
            col_summary.top_values = [{"value": str(k), "count": int(v)} for k, v in top.items()]

        columns.append(col_summary)

    return schemas.DatasetSummary(
        dataset_id=dataset_id,
        name=ds.name,
        row_count=n,
        column_count=len(df.columns),
        columns=columns,
    )
