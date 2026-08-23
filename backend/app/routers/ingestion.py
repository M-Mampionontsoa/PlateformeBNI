import io
import time
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/ingestion",
    tags=["ingestion"],
    dependencies=[Depends(get_current_user)],
)


def _run_ingestion(job_id: int, content: bytes, filename: str, db_factory):
    """Simule un pipeline d'ingestion multi-etapes (parsing -> validation -> stockage)."""
    db = db_factory()
    try:
        job = db.query(models.IngestionJob).get(job_id)

        job.status = models.IngestionStatus.PARSING
        job.progress = 10
        job.message = "Lecture et analyse du fichier..."
        db.commit()
        time.sleep(0.4)

        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as exc:
            job.status = models.IngestionStatus.FAILED
            job.message = f"Erreur de lecture du CSV: {exc}"
            db.commit()
            return

        job.progress = 40
        job.status = models.IngestionStatus.VALIDATING
        job.message = f"Validation du schema ({len(df.columns)} colonnes, {len(df)} lignes)..."
        db.commit()
        time.sleep(0.4)

        column_schema = [
            {"name": col, "dtype": str(df[col].dtype)} for col in df.columns
        ]

        dataset = models.Dataset(
            name=filename.rsplit(".", 1)[0],
            description=f"Ingere depuis {filename}",
            row_count=len(df),
            column_schema=column_schema,
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)

        job.progress = 70
        job.status = models.IngestionStatus.STORING
        job.message = "Ecriture des lignes en base..."
        job.dataset_id = dataset.id
        db.commit()
        time.sleep(0.4)

        df_clean = df.where(pd.notnull(df), None)
        rows = [
            models.DatasetRow(dataset_id=dataset.id, row_index=i, data=row)
            for i, row in enumerate(df_clean.to_dict(orient="records"))
        ]
        db.bulk_save_objects(rows)
        db.commit()

        job.progress = 100
        job.status = models.IngestionStatus.COMPLETED
        job.message = "Ingestion terminee."
        db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=schemas.IngestionJobOut)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers CSV sont acceptes pour ce MVP.")

    content = await file.read()

    job = models.IngestionJob(filename=file.filename, status=models.IngestionStatus.PENDING, progress=0)
    db.add(job)
    db.commit()
    db.refresh(job)

    from ..database import SessionLocal
    background_tasks.add_task(_run_ingestion, job.id, content, file.filename, SessionLocal)

    return job


@router.get("/jobs", response_model=list[schemas.IngestionJobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.IngestionJob).order_by(models.IngestionJob.created_at.desc()).all()


@router.get("/jobs/{job_id}", response_model=schemas.IngestionJobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.IngestionJob).get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job introuvable.")
    return job
