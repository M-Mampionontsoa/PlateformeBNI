from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/datasets", tags=["datasets"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.DatasetOut])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(models.Dataset).order_by(models.Dataset.created_at.desc()).all()


@router.get("/{dataset_id}", response_model=schemas.DatasetOut)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    ds = db.query(models.Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset introuvable.")
    return ds


@router.get("/{dataset_id}/data")
def get_dataset_data(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
):
    ds = db.query(models.Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset introuvable.")

    query = db.query(models.DatasetRow).filter(models.DatasetRow.dataset_id == dataset_id)
    total = query.count()
    rows = (
        query.order_by(models.DatasetRow.row_index)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "dataset_id": dataset_id,
        "columns": [c["name"] for c in (ds.column_schema or [])],
        "total": total,
        "page": page,
        "page_size": page_size,
        "rows": [r.data for r in rows],
    }


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    ds = db.query(models.Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset introuvable.")
    db.delete(ds)
    db.commit()
    return {"deleted": dataset_id}
